"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const form = document.querySelector("form");
const errorMessage = document.querySelector(".error-message");
if (form) {
    form.addEventListener("submit", e => {
        if (e instanceof SubmitEvent) {
            e.preventDefault();
            if (e.submitter)
                handleSubmit(e, e.submitter.id === "login-submit" ? "/login" : "/signup");
        }
    });
}
function handleSubmit(e, pathway) {
    return __awaiter(this, void 0, void 0, function* () {
        if (e.target instanceof HTMLFormElement) {
            const data = new FormData(e.target);
            const response = yield fetch(pathway, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: data.get("username"), password: data.get("password") }),
            });
            if (response.ok)
                window.location.reload();
            else
                handleResponseError(response);
        }
    });
}
function handleResponseError(response) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(errorMessage instanceof HTMLElement))
            return;
        const err = yield response.text();
        if (errorMessage.innerText)
            errorMessage.classList.add("flash");
        setTimeout(() => errorMessage.classList.remove("flash"), 50);
        errorMessage.innerText = err;
    });
}
