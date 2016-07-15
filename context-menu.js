window.addEventListener('load', function() {
  // var requestToConfig = new XMLHttpRequest();
  // requestToConfig.open('get', 'config.json', false);
  // re

  var menuConfig = {
    target: "root",
    items: [{
      title: 'item 1',
      onClick: "clickHandler",
      disabled: false,
      submenu: false
    },{
      title: 'item 2',
      onClick: "clickHandler",
      disabled: true,
      submenu: false
    }]
  }

  console.log(menuConfig);

  var targetElement = document.getElementById(menuConfig.target);
  if (targetElement === null) {
    throw new Error('Cannot find element with id \'' + menuConfig.target + '\'');
  }

  console.log(targetElement);

  targetElement.addEventListener('click', openContextMenu, false);

  
});