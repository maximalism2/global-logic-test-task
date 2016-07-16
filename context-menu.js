function ContextMenu() {
  this.contextMenuProps = { // State for main element of context menu
    x: 0,
    y: 0,
    open: false
  }

  this.submenuProps = {
    hasSubmenu: [],
    opened: []
  }

  this.menuTemplate = {}; // JSON config of menu
  this.targetElement = {}; // DOM Node of target element
  this.contextMenuNode = null; // Created element node with context menu
}

// Setting context menu config
ContextMenu.prototype.init = function() {
  this.menuTemplate = {
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
}

// Looking for the element with id from target field in JOSN config
ContextMenu.prototype.setTarget = function() {
  var targetElement = document.getElementById(this.menuTemplate.target);
  if (targetElement === null) {
    throw new Error('Cannot find element with id \'' + menuConfig.target + '\'');
  }
  var self = this;
  var show = this.show;
  targetElement.addEventListener('contextmenu', function(event) {
    show.call(self, event);
  }, false);
  this.targetElement = targetElement;
}

// Need to be called with this equal element node which will have inserted children
ContextMenu.prototype.createNode = function() {
  var contextMenuNode = document.createElement('div');
  contextMenuNode.className = "context-menu";
  contextMenuNode.id = 'contextMenu';
  insertMenuItems.call(contextMenuNode, this.menuTemplate.items);
  this.contextMenuNode = contextMenuNode;

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
}

ContextMenu.prototype.hide = function(target) {
  // if (!event.target.parentElement) {
  if (event.target.id !== 'contextMenu') {
    document.body.removeChild(document.getElementById('contextMenu'));
    window.removeEventListener('click', this.hide);
  }
}


window.addEventListener('load', function() {
  var menu = new ContextMenu();
  menu.init();
  menu.setTarget();
  menu.createNode();
  console.log('menu', menu);
});

ContextMenu.prototype.show = function(event) {
  event.preventDefault();
  console.log(event.x, event.y, document.body.clientHeight, document.body.clientWidth);

  console.log(this);
  this.contextMenuNode.style.top = event.y + 'px';
  this.contextMenuNode.style.left = event.x + 'px';
  document.body.appendChild(this.contextMenuNode);
  window.addEventListener('click', this.hide, false);
}

function clickHandler(event) {
  console.log('clicked', event);
}