let delay = 400; // 0.4 sec

window.onload = () => {
  let showPreloader = () => {
    document.querySelector(".spinner").style.display = "block"
    document.querySelector(".spinner").style.background = "rgba(255, 255, 255, .93)";
    document.querySelector(".fidget_spinner").style = "";
  }
  let hidePreloader = () => {
    document.querySelector(".spinner").style.background = "transparent";
    document.querySelector(".fidget_spinner").style.background = "transparent";
    setTimeout(() => { document.querySelector(".spinner").style.display = "none" }, 150)
  };

  let preloader = setTimeout(hidePreloader, delay);
};
