const cube = document.querySelector("#cube");
const stage = document.querySelector(".stage");

let rotationX = -22;
let rotationY = 34;
let activePointerId = null;
let previousX = 0;
let previousY = 0;

function render() {
  cube.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;
}

function beginDrag(event) {
  activePointerId = event.pointerId;
  previousX = event.clientX;
  previousY = event.clientY;
  stage.setPointerCapture(activePointerId);
}

function drag(event) {
  if (event.pointerId !== activePointerId) {
    return;
  }

  const deltaX = event.clientX - previousX;
  const deltaY = event.clientY - previousY;
  previousX = event.clientX;
  previousY = event.clientY;

  rotationY += deltaX * 0.55;
  rotationX -= deltaY * 0.55;
  render();
}

function endDrag(event) {
  if (event.pointerId !== activePointerId) {
    return;
  }

  if (stage.hasPointerCapture(activePointerId)) {
    stage.releasePointerCapture(activePointerId);
  }
  activePointerId = null;
}

stage.addEventListener("pointerdown", beginDrag);
stage.addEventListener("pointermove", drag);
stage.addEventListener("pointerup", endDrag);
stage.addEventListener("pointercancel", endDrag);

render();
