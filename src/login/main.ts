const form = document.querySelector("form");
const errorMessage = document.querySelector(".error-message");

if (form) {
	form.addEventListener("submit", e => {
		if (e instanceof SubmitEvent) {
			e.preventDefault();
			if (e.submitter) handleSubmit(e, e.submitter.id === "login-submit" ? "/login" : "/signup");
		}
	});
}

async function handleSubmit(e: SubmitEvent, pathway: "/login" | "/signup") {
	if (e.target instanceof HTMLFormElement) {
		const data = new FormData(<HTMLFormElement>e.target);
		const response = await fetch(pathway, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ username: data.get("username"), password: data.get("password") }),
		});

		if (response.ok) window.location.reload();
		else handleResponseError(response);
	}
}

async function handleResponseError(response: Response) {
	if (!(errorMessage instanceof HTMLElement)) return;

	const err = await response.text();

	if (errorMessage.innerText) errorMessage.classList.add("flash");
	setTimeout(() => errorMessage.classList.remove("flash"), 50);

	errorMessage.innerText = err;
}
