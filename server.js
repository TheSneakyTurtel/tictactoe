// database
import { z } from "zod";
import { Users, LoginDetails, User, UserSocketCredentials } from "./js/user.js";

// server
import express from "express";
import http from "http";
import { Server, Socket } from "socket.io";

// cryptography
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

// parsers
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

// paths & file systems
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// misc global constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// database init
const usersFilePath = path.join(__dirname, "users.json");
/** @type {z.infer<Users>} */
let users = {};

try {
	const usersFileContents = fs.readFileSync(usersFilePath, { encoding: "utf8", flag: "r" });
	const usersFileJson = JSON.parse(usersFileContents);
	const parsedUsers = Users.safeParse(usersFileJson);

	parsedUsers.success && (users = parsedUsers.data);
} catch (e) {
	fs.writeFileSync(usersFilePath, "{}", { encoding: "utf-8" });
}

// this code saves the users database on program exit

process.stdin.resume(); // so the program will not close instantly

function exitHandler(options, exitCode) {
	fs.writeFileSync(usersFilePath, JSON.stringify(users), { encoding: "utf-8" });

	if (options.exit) process.exit();
}

process.on("exit", exitHandler.bind(null, { cleanup: true }));
process.on("SIGINT", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));

// server init
const app = express();
const port = 3000;
const server = http.createServer(app);
const io = new Server(server);

// socket init
/** @type {Record<string, Socket>} */
const userSockets = {};

// hashing constants
const saltRounds = 10;

// express app middleware setup
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// express app view engine setup
app.set("view engine", "ejs");

// express app routes setup
app.get("/", (req, res) => {
	const loginCookieParse = LoginDetails.safeParse(req.cookies); // verification of the login cookie

	// check if the verification was successful, and if the user exists
	if (loginCookieParse.success && users[loginCookieParse.data.username]) {
		// safely check if the login cookie's password hash matches with the user's actual password hash
		if (bcrypt.compareSync(req.cookies.password, users[req.cookies.username].passwordHash))
			res.render("index", { username: req.cookies?.username, user: users[req.cookies?.username] }); // the password was correct, log them in, and let them have fun! :D
		else res.render("login", { error: "Password is incorrect, try again." }); // the password was incorrect, redirect and let the client know
	} else res.render("login", { error: "An unexpected error occurred, please try again" }); // the verification was not successful, redirect and let the client know that something went wrong with logging them in
});

app.get("/logout", async (req, res) => {
	res.clearCookie("username").clearCookie("password").redirect("/"); // redirect the user
});

app.post("/login", async (req, res) => {
	const parse = LoginDetails.safeParse(req.body); // the request's body verification, basically making sure that the request has the needed details

	if (!parse.success) return res.sendStatus(400); // the verification failed, this just means that the request was bad from the client side
	if (!users[parse.data.username]) return res.status(307).send("Account does not exist, did you mean to sign up?"); // the verification was successful, but the user does not exist

	res.cookie("username", parse.data.username).cookie("password", parse.data.password).redirect("/"); // redirect the user
});

app.post("/signup", async (req, res) => {
	const parse = LoginDetails.safeParse(req.body); // the request's body verification, basically making sure that the request has the needed details

	if (!parse.success) return res.sendStatus(400); // the verification failed, this just means that the request was bad from the client side
	if (users[parse.data.username]) return res.status(307).send("Account already exists, did you mean to log in?"); // the verification was successful, but the user already exists

	const passwordHash = await bcrypt.hash(parse.data.password, saltRounds); // hash the entered password
	const newUserParse = User.safeParse({ passwordHash }); // parse the entered data into a user (this should always work)

	if (!newUserParse.success) return res.sendStatus(500); // in case the parse fails, which should never happen, let the user know, and stop here

	users[parse.data.username] = newUserParse.data; // add the user to the database

	res.cookie("username", parse.data.username).cookie("password", parse.data.password).redirect("/"); // redirect the user
});

app.get("/js/*", (req, res) => {
	res.sendFile(__dirname + req.url); // serve the requested JavaScript
});

app.get("/css/*", (req, res) => {
	res.sendFile(__dirname + req.url); // serve the requested CSS
});

// socket.io middleware setup
io.use((socket, next) => {
	// get the credentials of the connected client
	const credentials = socket.handshake.auth.token;

	// if the credentials don't exist, throw an appropriate error
	if (typeof credentials !== "string") return next(new Error("Could not verify socket credentials: no credentials provided"));

	// pre-parse the credentials before actually parsing them
	const credentialLines = credentials.split("\n");
	const credentialsParse = UserSocketCredentials.safeParse({ username: credentialLines[0], passwordHash: credentialLines[1] });

	// if the parsed credentials are all okay, proceed, otherwise, exit with an appropriate error message
	if (!credentialsParse.success) return next(new Error("Could not verify socket credentials: invalid shape"));
	if (!users[credentialsParse.data.username]) return next(new Error("Could not verify socket credentials: user does not exist"));
	if (users[credentialsParse.data.username].passwordHash !== credentialsParse.data.passwordHash)
		return next(new Error("Could not verify socket credentials: password is incorrect"));

	// log the client's socket in the userSockets hashmap
	userSockets[credentialsParse.data.username] = socket;
	socket.on("disconnect", () => (userSockets[credentialsParse.data.username] = undefined));

	next(); // finish off by calling next
});

// socket.io event listeners & handlers
io.on("connection", socket => {
	socket.on("create game", (against, callback) => matchmake(socket, against, callback));
});

function matchmake(socket, against, callback) {
	const validation = validateMatchmakingRequest(socket, against, callback);

	if (validation.error) return callback(validation.error);

	userSockets[against].emit("matchmaking request", validation.clientUsername, response => {
		console.log(response);
		if (!response.ok) return callback({ error: "User did not accept the match" });

		callback({ success: true });

		const matchmakingRoomName = uuidv4();

		socket.join(matchmakingRoomName);
		userSockets[against].join(matchmakingRoomName);
		io.in(matchmakingRoomName).emit("game created");
	});
}

/**
 * @returns {{ error: string; clientUsername?: string; } | { clientUsername: string; }}
 */
function validateMatchmakingRequest(socket, against, callback) {
	if (typeof callback !== "function") return socket.disconnect();
	if (typeof against !== "string") return callback({ error: "Invalid request" });

	const clientUsername = Object.entries(userSockets).find(([, userSocket]) => socket === userSocket)?.[0];

	if (!clientUsername) return { error: "Invalid credentials", clientUsername };
	if (clientUsername === against) return { error: "Client is attempting to match with themselves", clientUsername };
	if (socket.rooms.size > 1) return { error: "Client is attempting to match-make whilst already being in a match", clientUsername };
	if (!userSockets[against]) return { error: "User not available", clientUsername };
	if (userSockets[against].rooms.size > 1) return { error: "Client is attempting to match-make a user who's already in a match", clientUsername };

	return { clientUsername };
}

server.listen(port, "192.168.1.15", () => {
	console.log(`Listening on http://192.168.1.15:${port}`); // establish a connection
});
