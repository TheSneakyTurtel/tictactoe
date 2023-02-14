"use strict";
const hoverables = document.querySelectorAll(".hover-effect");
hoverables.forEach(hoverable => {
    if (!(hoverable instanceof HTMLElement))
        return;
    const edges = { left: "left", top: "top", bottom: "bottom", right: "right" };
    const handleMouseEvent = (e, type) => {
        const dir = closestEdge(e, hoverable, edges);
        hoverable.dataset.enterFrom = type === "enter" ? dir : "";
        hoverable.dataset.exitFrom = type === "exit" ? dir : "";
    };
    hoverable.addEventListener("mouseenter", e => handleMouseEvent(e, "enter"));
    hoverable.addEventListener("mouseleave", e => handleMouseEvent(e, "exit"));
});
function closestEdge(mouse, elem, edges) {
    const elemBounding = elem.getBoundingClientRect();
    const elementLeftEdge = elemBounding.left;
    const elementTopEdge = elemBounding.top;
    const elementRightEdge = elemBounding.right;
    const elementBottomEdge = elemBounding.bottom;
    const mouseX = mouse.pageX;
    const mouseY = mouse.pageY;
    const topEdgeDist = Math.abs(elementTopEdge - mouseY);
    const bottomEdgeDist = Math.abs(elementBottomEdge - mouseY);
    const leftEdgeDist = Math.abs(elementLeftEdge - mouseX);
    const rightEdgeDist = Math.abs(elementRightEdge - mouseX);
    const min = Math.min(topEdgeDist, bottomEdgeDist, leftEdgeDist, rightEdgeDist);
    return min === leftEdgeDist ? edges.left : min === rightEdgeDist ? edges.right : min === topEdgeDist ? edges.top : edges.bottom;
}
