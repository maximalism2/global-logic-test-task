function ContextMenu() {
  this.contextMenuProps = { // State for main element of context menu
    x: 0,
    y: 0,
    open: false
  }

  this.submenuProps = {
    list: [],
    opened: []
  }

  this.menuTemplate = {}; // JSON config of menu
  this.targetElement = {}; // DOM Node of target element
  this.contextMenuNode = null; // Created element node with context menu
  this.overlayNode = null; // Overlay element to cover whole viewport

  this.transitoinDelay = 300; // Delay before menu will be redrawed
}

// Setting context menu config
ContextMenu.prototype.init = function() {
  var self = this;
  var requestForConfig = new XMLHttpRequest();
  requestForConfig.open('GET', 'config.json', true);
  requestForConfig.onreadystatechange = function() {
    if (requestForConfig.readyState == 4) {
      if(requestForConfig.status == 200) {
        self.menuTemplate = JSON.parse(requestForConfig.responseText);

        menu.setTarget();
        menu.createNode();
      }
    }
  };
  requestForConfig.send(null);
}

// To hide all submenu which is showed
ContextMenu.prototype.resetCondition = function(fromLevel) {
  if (fromLevel === undefined) {
    fromLevel = 0;
  }

  restoreDefaultClassNames(this.contextMenuNode.children, fromLevel, 0);

  function restoreDefaultClassNames(nodeList, fromLevel, currentLevel) {
    console.log(fromLevel, currentLevel);
    [].forEach.call(nodeList, function(item) {
      // If it is an item of context menu and it has submenu
      console.log(item.className);
      if (item.className.indexOf('context-menu-item') !== -1 && item.className.indexOf('has-sub-items') !== -1) {
        // And it is that level of depth which we need
        console.info('found!');
        if (fromLevel <= currentLevel) {
          [].forEach.call(item.children, function(child) {
            if (child.className.indexOf('submenu-label') !== -1) {
              child.className = "submenu-label"; 
            }
          });
        }
        restoreDefaultClassNames(item.children, fromLevel, currentLevel + 1);
      } else {
        restoreDefaultClassNames(item.children, fromLevel, currentLevel);
      }
    });
  }
}

// Looking for the element with id from target field in JOSN config
ContextMenu.prototype.setTarget = function() {
  var targetElement = document.getElementById(this.menuTemplate.target);
  if (targetElement === null) {
    throw new Error('Cannot find element with id \'' + this.menuTemplate.target + '\'');
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
  var self = this, hide = this.hide;

  // Creating menu's overlay to cover all elements on the page
  var overlay = document.createElement('div');
  overlay.className = "context-menu-overlay";
  overlay.id = "contextMenuOverlay";

  overlay.addEventListener('click', function(event) {
    hide.call(self, hide);
  }, false);

  this.overlayNode = overlay;

  // Creating context menu with all children elements
  var contextMenuNode = document.createElement('div');

  contextMenuNode.className = "context-menu";
  contextMenuNode.id = 'contextMenu';
  insertMenuItems.call(contextMenuNode, this.menuTemplate.items, false, 0);

  this.contextMenuNode = contextMenuNode;

  function insertMenuItems(items, isSubmenu, level) {
    var itemsWrapper = document.createElement('div');
    if (isSubmenu) {
      itemsWrapper.className = 'submenu';
    }

    items.forEach(function(item, index) {
      var itemElement = document.createElement('div');
      var textWrapper = document.createElement('span');
      textWrapper.className = 'label';
      textWrapper.innerText = item.title;
      itemElement.appendChild(textWrapper);
      itemElement.className = 'context-menu-item';
      itemElement.id = generateId();
      
      itemElement.addEventListener('click', window[item.onClick], false);
      itemElement.addEventListener('mouseenter', function(event) {
        self.mouseEnterHandler(itemElement, item, level);
      }, false);

      if (item.disabled) {
        itemElement.className += ' is-disabled';
        itemElement.removeEventListener('click', window[item.onClick]);
      }

      if (item.submenu && item.submenu.length) {
        var submenuWrapper = document.createElement('div');
        submenuWrapper.className = 'context-menu-item has-sub-items';
        itemElement.className = 'submenu-label';
        itemElement.removeEventListener('click', window[item.onClick]);
        submenuWrapper.appendChild(itemElement);

        insertMenuItems.call(submenuWrapper, item.submenu, true, level + 1);
        itemsWrapper.appendChild(submenuWrapper)
      } else {
        itemsWrapper.appendChild(itemElement);
      }
    });

    this.appendChild(itemsWrapper);
  }
}

ContextMenu.prototype.hide = function(target) {
  document.body.removeChild(document.getElementById('contextMenu'));
  document.body.removeChild(document.getElementById('contextMenuOverlay'));
}

ContextMenu.prototype.show = function(event) {
  event.preventDefault();

  console.table({
    userEvent: {
      x: event.x,
      y: event.y
    },
    viewport: {
      x: document.body.clientWidth,
      y: document.body.clientHeight
    }
  });

  this.contextMenuNode.style.top = event.y + 'px';
  this.contextMenuNode.style.left = event.x + 'px';

  document.body.appendChild(this.overlayNode);
  document.body.appendChild(this.contextMenuNode);
}

ContextMenu.prototype.mouseEnterHandler = function(node, item, itemPepthLevel) {
  // If item is not disabled and has submenu - waiting some time and show it
  var delay = this.transitoinDelay;
  
  this.resetCondition(itemPepthLevel);

  if (!item.disabled && item.submenu && item.submenu.length) {
    window[node.id] = setTimeout(function() {
      node.className = "submenu-label submenu-showed";
    }, delay);

    node.addEventListener('mouseleave', function(event) {
      clearTimeout(window[node.id]);
    }, false)
  }
}

function generateId() {
  // cxmi means ConteXt Menu Item :)
  return 'cxmi_' + Math.round(Math.random() * 9000 + 1000);
}

function clickHandler(event) {
  console.log('clicked', event);
}

var menu = null;
window.addEventListener('load', function() {
  menu = new ContextMenu();

  menu.init();
});
