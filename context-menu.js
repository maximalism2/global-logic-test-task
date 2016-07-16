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
    },{
      title: 'item 2',
      onClick: "clickHandler",
      disabled: false,
      submenu: [{
        title: 'sub item 1',
        onClick: "clickHandler",
        disabled: true,
        submenu: false
      },{
        title: 'sub item 1',
        onClick: "clickHandler",
        disabled: true,
        submenu: false
      },{
        title: 'sub item 1',
        onClick: "clickHandler",
        disabled: true,
        submenu: false
      },]
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

  targetElement.addEventListener('contextmenu', openContextMenu, false);
  var contextMenuTemplateElement = document.createElement('div');
  contextMenuTemplateElement.className = "context-menu";
  contextMenuTemplateElement.id = 'contextMenu';
  insertMenuItems.call(contextMenuTemplateElement, menuConfig.items);


  function openContextMenu(event) {
    event.preventDefault();
    console.log(event.x, event.y, document.body.clientHeight, document.body.clientWidth);

    contextMenuTemplateElement.style.top = event.y + 'px';
    contextMenuTemplateElement.style.left = event.x + 'px';
    document.body.appendChild(contextMenuTemplateElement);
    window.addEventListener('click', needToHideContext, false);
  }
});

function needToHideContext(event) {
  // if (!event.target.parentElement) {
  if (event.target.id !== 'contextMenu') {
    document.body.removeChild(document.getElementById('contextMenu'));
  }
}

function insertMenuItems(items, isSubmenu) {
  var itemsWrapper = document.createElement('div');
  if (isSubmenu) {
    itemsWrapper.className = 'submenu'
  }

  items.forEach(function(item, index) {
    var itemElement = document.createElement('div');
    var textWrapper = document.createElement('span');
    textWrapper.innerText = item.title;
    itemElement.appendChild(textWrapper);
    itemElement.className = 'context-menu-item';
    itemElement.addEventListener('click', window[item.onClick], false);

    if (item.disabled) {
      itemElement.className += ' is-disabled';
      itemElement.removeEventListener('click', window[item.onClick]);
    }

    if (item.submenu) {
      itemElement.className += ' has-sub-items submenu-hidden';
      itemElement.removeEventListener('click', window[item.onClick]);
      // itemElement.addEventListener('click', openContextMenu())
      insertMenuItems.call(itemElement, item.submenu, true);
    }

    itemsWrapper.appendChild(itemElement);
  });

  this.appendChild(itemsWrapper);
}

function clickHandler(event) {
  console.log(event);
}