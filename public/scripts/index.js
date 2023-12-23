let selectedDifficulty = "Easy"; // Change const to let

document.addEventListener("DOMContentLoaded", function () {
  let btnStartGame = document.getElementById("btnStartGame");
  btnStartGame.addEventListener("click", startGame);

  function startGame() {
    selectedDifficulty = document.getElementById("difficulty").value;
    console.log(selectedDifficulty);

    window.location.href = `/game.html?difficulty=${selectedDifficulty}`;
  }
});
