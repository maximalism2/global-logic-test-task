function ContextMenu() {
  this.state = {
    opened: [],
    active: []
  }

  this.mouseIsOn = ''; // Field includes id of item, which has pointer abose itself
  this.menuTemplate = {}; // JSON config of menu
  this.targetElement = {}; // DOM Node of target element
  this.contextMenuNode = null; // Created element node with context menu
  this.overlayNode = null; // Overlay element to cover whole viewport

  this.transitoinDelay = 500; // Delay before menu will be redrawed
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
    [].forEach.call(nodeList, function(item) {
      // If it is an item of context menu and it has submenu
      if (item.className.indexOf('context-menu-item') !== -1 && item.className.indexOf('has-sub-items') !== -1) {
        // And it is that level of depth which we need
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
    self.resetCondition.call(self);
  }, false);

  overlay.addEventListener('contextmenu', function(event) {
    event.preventDefault();
    self.resetCondition.call(self);
    hide.call(self, hide);
  }, false)

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
      
      itemElement.addEventListener('mouseenter', function(event) {
        self.mouseEnterHandler(itemElement, item, level);
      }, false);

      if (!item.disabled && !item.submenu) {
        itemElement.addEventListener('click', function(event) {
          self.hide();
          self.resetCondition();
          window[item.onClick](event);
        }, false);
      }

      if (item.disabled) {
        itemElement.className += ' is-disabled';
      }

      if (item.submenu && item.submenu.length) {
        var submenuWrapper = document.createElement('div');
        submenuWrapper.className = 'context-menu-item has-sub-items';
        itemElement.className = 'submenu-label';
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
  console.log(this);
  window.removeEventListener('keydown', this.keyDownHandler);
}

ContextMenu.prototype.show = function(event) {
  event.preventDefault();
  var self = this;

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
  this.keyDownHandler = this.keyDownHandler.bind(this);

  document.body.appendChild(this.overlayNode);
  document.body.appendChild(this.contextMenuNode);
  window.addEventListener('keydown', this.keyDownHandler, false);
}

ContextMenu.prototype.openSubmenuById = function(id, depthLevel) {
  var currentOpenedSubmenus = this.state.opened;
  var newOpenedSubmenus = currentOpenedSubmenus.splice(0, depthLevel);
  newOpenedSubmenus.push(id);
  this.state.opened = newOpenedSubmenus; // Save new list of opened submenus
  this.redraw(); // Redraw menu
}

ContextMenu.prototype.keyDownHandler = function(event) {
  console.log(event.which);
  switch (event.which) {
    case 37: { // Left arrow
      break;
    }
    case 38: { // Up arrow
      break;
    }
    case 39: { // Right arrow
      break;
    }
    case 40: { // Down arrow
      // this.state.active;
      if (!this.state.active.length) {
        var firstItemOfMenu = document.querySelector('.context-menu .context-menu-item');
        this.state.active.push(firstItemOfMenu.id);
      }
      console.log(this.state.active);
      // [].forEach.call(this.contextMenuNode.children, function(item) {
      //   console.log(item.className);
      // });
      break;
    }
  }
}

ContextMenu.prototype.changeActive = function() {

}

ContextMenu.prototype.closeSubmenusFromLevel = function(level) {
  var currentOpenedSubmenus = this.state.opened;
  var newOpenedSubmenus = currentOpenedSubmenus.slice(0, level);
  this.state.opened = newOpenedSubmenus;
  this.redraw();
}

ContextMenu.prototype.mouseEnterHandler = function(node, item, itemDepthLevel) {
  // If item is not disabled and has submenu - waiting some time and show it
  var self = this;
  var delay = this.transitoinDelay;
  
  this.mouseIsOn = node.id;

  if (!item.disabled && item.submenu && item.submenu.length) {
    window[node.id] = setTimeout(function() {
      if (self.mouseIsOn === node.id) {
        if (self.state.opened.indexOf(node.id) === -1) {
          self.resetCondition(itemDepthLevel);
          self.openSubmenuById(node.id, itemDepthLevel);
        }
      }
    }, delay);
  } else {
    window[node.id] = setTimeout(function() {
      self.closeSubmenusFromLevel(itemDepthLevel);
    }, delay);
  }
}

ContextMenu.prototype.redraw = function() {
  this.resetCondition();
  var openedSubmenus = this.state.opened;
  openedSubmenus.forEach(function(id) {
    var submenuLabel = document.getElementById(id);
    if (submenuLabel) {
      submenuLabel.className = "submenu-label submenu-showed";
    }
  });
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
