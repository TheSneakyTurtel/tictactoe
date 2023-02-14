import { MOVE_O, MOVE_X } from "../constants.js";

const emptyBoard = [undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined] as const;

customElements.define(
	"tic-tac-toe",
	class extends HTMLElement {
		board: TTTBoard = [...emptyBoard];
		boardElement: HTMLElement;
		boardCellElements: TTTBoardElements;
		clientIs: boolean | undefined = undefined;

		constructor() {
			super();

			const clientIs = this.dataset.clientIs;
			if (clientIs === "x" || clientIs === "o") this.clientIs = clientIs === "o";

			const stylesheet = document.createElement("link");
			stylesheet.rel = "stylesheet";
			stylesheet.href = "/css/tictactoe.css";
			this.attachShadow({ mode: "open" }).append(stylesheet);

			this.boardElement = document.createElement("div");
			this.boardElement.classList.add("board");
			this.shadowRoot!.append(this.boardElement);

			this.boardCellElements = createBoardElements(() => {
				const boardCellElement = document.createElement("div");
				boardCellElement.classList.add("cell");

				this.boardElement.append(boardCellElement);

				return boardCellElement;
			});
		}

		attributeChangedCallback(name: string, oldVal: string, newVal: string) {
			switch (name) {
				case "data-state":
					this.board = parseStateData(newVal);
					this.updateDisplay();
					break;
				case "data-client-is":
					this.boardElement.dataset.clientIs = newVal;
					break;
			}
		}

		updateDisplay() {
			for (let i = 0; i < 9; i++) {
				const cell = this.board[i];
				this.boardCellElements[i].classList.toggle("x", cell === MOVE_X);
				this.boardCellElements[i].classList.toggle("o", cell === MOVE_O);
			}
		}

		static get observedAttributes() {
			return ["data-state", "data-client-is"];
		}
	},
);

function createBoardElements(createBoardElement: (i: number) => HTMLElement): TTTBoardElements {
	const boardElements: TTTBoardUndefinableElements = [...emptyBoard];
	for (let i = 0; i < 9; i++) boardElements[i] = createBoardElement(i);
	return <TTTBoardElements>boardElements;
}

function parseStateData(stateData: string): TTTBoard {
	const stateMap = { o: MOVE_O, x: MOVE_X, "-": undefined } as const;
	const rawData = stateData.replace(/ /g, "");
	const board: TTTBoard = [...emptyBoard];

	if (rawData.length !== 9) throw new Error("state data invalid: wrong length");

	let i = 0;
	for (const cellState of rawData) {
		if (cellState in stateMap) board[i++] = stateMap[<keyof typeof stateMap>cellState];
		else throw new Error("state data invalid: invalid char '" + cellState + "'");
	}

	return board;
}

type TTTBoardUndefinableElements = (HTMLElement | undefined)[];
type TTTBoardElements = HTMLElement[];
type TTTBoard = TTTCell[];
type TTTCell = boolean | undefined;
