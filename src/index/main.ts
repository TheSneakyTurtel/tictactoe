import ContentManager from "./content-manager.js";

const mainContent = document.getElementById("main-content");
const sidebar = document.getElementById("sidebar");

if (mainContent && sidebar) {
	const cm = new ContentManager(mainContent);
	let prevSidebarSelector: HTMLElement | undefined = undefined;

	sidebar.addEventListener("click", e => {
		const sidebarSelector = e.target;

		if (sidebarSelector instanceof HTMLElement && !isNaN(parseInt(sidebarSelector.dataset.sectionIndex!)) && prevSidebarSelector !== sidebarSelector) {
			const sectionIndex = parseInt(sidebarSelector.dataset.sectionIndex!)!;
			cm.activate(sectionIndex, { speed: 1500 });

			if (prevSidebarSelector) prevSidebarSelector.classList.remove("active");
			else for (let i = 0; i < sidebarSelector.parentElement!.children.length; i++) sidebarSelector.parentElement!.children[i].classList.remove("active");

			sidebarSelector.classList.add("active");
			prevSidebarSelector = sidebarSelector;
		}
	});
}
