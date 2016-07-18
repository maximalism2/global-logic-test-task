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
ContextMenu.prototype.init = function(param) {
  var self = this;
  if (typeof param === 'string') {
    var requestForConfig = new XMLHttpRequest();
    requestForConfig.open('GET', param, true);
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
  } else if (typeof param === 'object' && !Array.isArray(param)) {
    this.menuTemplate = JSON.parse(JSON.stringify(param));
  } else {
    throw new Error('Menu can be configured by JSON object, which can be provided by url or plain object');
  }
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

  overlay.addEventListener('click', function() {
    hide.call(self);
  }, false);

  overlay.addEventListener('contextmenu', function(event) {
    event.preventDefault();
    hide.call(self);
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
      textWrapper.innerHTML = item.title;
      itemElement.appendChild(textWrapper);
      itemElement.className = 'context-menu-item';
      itemElement.id = generateId();
      
      itemElement.addEventListener('mouseenter', function(event) {
        self.mouseEnterHandler(itemElement, item, level);
      }, false);

      if (!item.disabled && !item.submenu) {
        itemElement.setAttribute('data-click-listener', item.onClick);
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
  document.body.style.overflow = 'auto';
  this.clearActiveItems();
  this.resetCondition();
  window.removeEventListener('keydown', this.keyDownHandler);
}

ContextMenu.prototype.show = function(event) {
  event.preventDefault();
  var self = this;
  document.body.style.overflow = 'hidden';
  var viewport = {
    width: document.body.clientWidth,
    height: document.body.clientHeight
  }

  console.table({
    userEvent: {
      x: event.clientX,
      y: event.clientY
    },
    viewport: {
      x: document.body.clientWidth,
      y: document.body.clientHeight
    }
  });

  if (event.clientX + 200 > viewport.width) {
    this.contextMenuNode.style.left = 'auto';
    this.contextMenuNode.style.right = '0px';
  } else {
    this.contextMenuNode.style.left = event.clientX + 'px';
    this.contextMenuNode.style.right = 'auto';
  }

  var menuHeight = this.menuTemplate.items.length * 20;
  if (event.clientY + menuHeight > viewport.height) {
    this.contextMenuNode.style.top = 'auto';
    this.contextMenuNode.style.bottom = '0px';
  } else {
    this.contextMenuNode.style.top = event.clientY + 'px';
    this.contextMenuNode.style.bottom = 'auto';
  }

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
  switch (event.which) {
    case 27: { // Esc key
      this.hide();
    }
    case 13: { // Enter key
      if (this.state.active.length) {
        var active = this.state.active;
        var self = this;
        var currentActiveNode = active[active.length - 1];
        if (currentActiveNode.className.indexOf('has-sub-items') !== -1) {
          [].forEach.call(currentActiveNode.children, function(child) {
            if (child.className.indexOf('submenu-label') !== -1) {
              self.openSubmenuById(child.id, active.length - 1);
            } else if (child.className === 'submenu') {
              var previousNumberOfActive = active.length;
              [].forEach.call(child.children, function(child) {
                if (child.className.indexOf('context-menu-item') !== -1) {
                  var newNumberOfActive = self.state.active.length;
                  if (previousNumberOfActive === newNumberOfActive) {
                    child.className += ' active';
                    self.state.active.push(child);
                  }
                }
              });
            }
          });
        } else {
          if (currentActiveNode.className.indexOf('is-disabled') === -1) {
            var onClickListener = currentActiveNode.getAttribute('data-click-listener');
            this.hide();
            window[onClickListener](event);
          }
        }
      };
      break;
    }
    case 37: { // Left arrow
      if (this.state.active.length > 1) {
        var active = this.state.active;
        var item = active[active.length - 1];
        var currentActiveClassName = item.className;
        var activeWordIndex = currentActiveClassName.indexOf(' active');
        var firstChunkOfClassName = currentActiveClassName.slice(0, activeWordIndex);
        var secondChunkOfClassName = currentActiveClassName.slice((activeWordIndex + ' active'.length));
        item.className = firstChunkOfClassName + secondChunkOfClassName;
        if (this.state.opened.length > 0) {
          this.state.opened = this.state.opened.slice(0, this.state.opened.length - 1);
          this.redraw();
        }
        this.state.active = active.slice(0, active.length - 1);
      }
      break;
    }
    case 38: { // Up arrow
      if (this.state.active.length) {
        var active = this.state.active;
        var currentActiveNode = active[active.length - 1];
        var arrayOfSiblings = [].slice.call(currentActiveNode.parentElement.children);
        var currentActiveNodePosition = arrayOfSiblings.indexOf(currentActiveNode);

        var currentActiveClassName = currentActiveNode.className;
        var activeWordIndex = currentActiveClassName.indexOf(' active');
        var firstChunkOfClassName = currentActiveClassName.slice(0, activeWordIndex);
        var secondChunkOfClassName = currentActiveClassName.slice((activeWordIndex + ' active'.length));
        currentActiveNode.className = firstChunkOfClassName + secondChunkOfClassName;

        var newActiveElement = arrayOfSiblings[currentActiveNodePosition - 1];

        if (currentActiveNodePosition - 1 < 0) {
          newActiveElement = arrayOfSiblings[arrayOfSiblings.length - 1];
        }

        newActiveElement.className += ' active';

        this.state.active[active.length - 1] = newActiveElement;
      }
      break;
    }
    case 39: { // Right arrow
      if (this.state.active.length) {
        var active = this.state.active;
        var self = this;
        var currentActiveNode = active[active.length - 1];
        [].forEach.call(currentActiveNode.children, function(child) {
          if (child.className.indexOf('submenu-label') !== -1) {
            self.openSubmenuById(child.id, active.length - 1);
          } else if (child.className === 'submenu') {
            var previousNumberOfActive = active.length;
            [].forEach.call(child.children, function(child) {
              if (child.className.indexOf('context-menu-item') !== -1) {
                var newNumberOfActive = self.state.active.length;
                if (previousNumberOfActive === newNumberOfActive) {
                  child.className += ' active';
                  self.state.active.push(child);
                }
              }
            });
          }
        });
      }
      break;
    }
    case 40: { // Down arrow
      if (!this.state.active.length) {
        var firstItemOfMenu = document.querySelector('.context-menu .context-menu-item');
        firstItemOfMenu.className += " active";
        this.state.active.push(firstItemOfMenu);
      } else {
        var active = this.state.active;
        var currentActiveNode = active[active.length - 1];
        var arrayOfSiblings = [].slice.call(currentActiveNode.parentElement.children);
        var currentActiveNodePosition = arrayOfSiblings.indexOf(currentActiveNode);

        var currentActiveClassName = currentActiveNode.className;
        var activeWordIndex = currentActiveClassName.indexOf(' active');
        var firstChunkOfClassName = currentActiveClassName.slice(0, activeWordIndex);
        var secondChunkOfClassName = currentActiveClassName.slice((activeWordIndex + ' active'.length));
        currentActiveNode.className = firstChunkOfClassName + secondChunkOfClassName;

        var newActiveElement = arrayOfSiblings[currentActiveNodePosition + 1];

        if (currentActiveNodePosition + 1 === arrayOfSiblings.length) {
          newActiveElement = arrayOfSiblings[0];
        }

        newActiveElement.className += ' active';

        this.state.active[active.length - 1] = newActiveElement;
      }
      break;
    }
  }
}

ContextMenu.prototype.clearActiveItems = function() {
  var active = this.state.active;
  active.forEach(function(item) {
    var currentActiveClassName = item.className;
    var activeWordIndex = currentActiveClassName.indexOf(' active');
    var firstChunkOfClassName = currentActiveClassName.slice(0, activeWordIndex);
    var secondChunkOfClassName = currentActiveClassName.slice((activeWordIndex + ' active'.length));
    item.className = firstChunkOfClassName + secondChunkOfClassName;
  });
  this.state.active = [];
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

  if (this.state.active.length) {
    this.clearActiveItems();
  }

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
    setTimeout(function() {
      self.closeSubmenusFromLevel(itemDepthLevel);
    }, delay);
  }
}


ContextMenu.prototype.redraw = function() {
  this.resetCondition();
  var openedSubmenus = this.state.opened;
  var contextMenuNode = this.contextMenuNode;
  openedSubmenus.forEach(function(id, index) {
    var submenuLabel = document.getElementById(id);
    if (submenuLabel) {
      submenuLabel.className = "submenu-label submenu-showed";
      var submenuContainer = submenuLabel.parentElement.children[1] // <- div.submenu
      var cmnStyles = contextMenuNode.style; // Current context node styles in short form;
      var onRight = Number(cmnStyles.right.slice(0, cmnStyles.right.length - 2)); // Get number of value, if it isn't auto
      var onLeft = Number(cmnStyles.left.slice(0, cmnStyles.left.length - 2));
      submenuContainer.style.zIndex = 100 * (index + 1);
      // If menu is pulled right or near the right border of viewport
      if (isNaN(onLeft) || (onLeft + 200 * (index + 2) > document.body.clientWidth)) {
        submenuContainer.style.left = '-100%';
        submenuContainer.style.right = 'auto';
      } else {
        submenuContainer.style.right = '-100%';
        submenuContainer.style.left = 'auto';
      }
    }
  });
}

function generateId() {
  // cxmi means ConteXt Menu Item :)
  return 'cxmi_' + Math.round(Math.random() * 9000 + 1000);
}

var menu = null;
window.addEventListener('load', function() {
  menu = new ContextMenu();

  menu.init('config.json');
});


function clickHandler(event) {
  alert('Action listener called');
  console.log(event)
}
