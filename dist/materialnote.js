/**
 * Super simple wysiwyg editor v2.0.0
 * http://materialnote.org/
 *
 * materialnote.js
 * Copyright 2017 CK and other contributors
 * based on summernote.js, copyright 2013- Alan Hong. and other contributors
 * materialnote may be freely distributed under the MIT license./
 *
 * Date: 2017-09-08T09:51Z
 */
(function (factory) {
  /* global define */
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    factory(window.jQuery);
  }
}(function ($) {
  'use strict';

  var isSupportAmd = typeof define === 'function' && define.amd;

  /**
   * returns whether font is installed or not.
   *
   * @param {String} fontName
   * @return {Boolean}
   */
  var isFontInstalled = function (fontName) {
    var testFontName = fontName === 'Comic Sans MS' ? 'Courier New' : 'Comic Sans MS';
    var $tester = $('<div>').css({
      position: 'absolute',
      left: '-9999px',
      top: '-9999px',
      fontSize: '200px'
    }).text('mmmmmmmmmwwwwwww').appendTo(document.body);

    var originalWidth = $tester.css('fontFamily', testFontName).width();
    var width = $tester.css('fontFamily', fontName + ',' + testFontName).width();

    $tester.remove();

    return originalWidth !== width;
  };

  var userAgent = navigator.userAgent;
  var isMSIE = /MSIE|Trident/i.test(userAgent);
  var browserVersion;
  if (isMSIE) {
    var matches = /MSIE (\d+[.]\d+)/.exec(userAgent);
    if (matches) {
      browserVersion = parseFloat(matches[1]);
    }
    matches = /Trident\/.*rv:([0-9]{1,}[\.0-9]{0,})/.exec(userAgent);
    if (matches) {
      browserVersion = parseFloat(matches[1]);
    }
  }

  var isEdge = /Edge\/\d+/.test(userAgent);

  var hasCodeMirror = !!window.CodeMirror;
  if (!hasCodeMirror && isSupportAmd && typeof require !== 'undefined') {
    if (typeof require.resolve !== 'undefined') {
      try {
        // If CodeMirror can't be resolved, `require.resolve` will throw an
        // exception and `hasCodeMirror` won't be set to `true`.
        require.resolve('codemirror');
        hasCodeMirror = true;
      } catch (e) {
        // Do nothing.
      }
    } else if (typeof eval('require').specified !== 'undefined') {
      hasCodeMirror = eval('require').specified('codemirror');
    }
  }

  var isSupportTouch =
    (('ontouchstart' in window) ||
     (navigator.MaxTouchPoints > 0) ||
     (navigator.msMaxTouchPoints > 0));

  /**
   * @class core.agent
   *
   * Object which check platform and agent
   *
   * @singleton
   * @alternateClassName agent
   */
  var agent = {
    isMac: navigator.appVersion.indexOf('Mac') > -1,
    isMSIE: isMSIE,
    isEdge: isEdge,
    isFF: !isEdge && /firefox/i.test(userAgent),
    isPhantom: /PhantomJS/i.test(userAgent),
    isWebkit: !isEdge && /webkit/i.test(userAgent),
    isChrome: !isEdge && /chrome/i.test(userAgent),
    isSafari: !isEdge && /safari/i.test(userAgent),
    browserVersion: browserVersion,
    jqueryVersion: parseFloat($.fn.jquery),
    isSupportAmd: isSupportAmd,
    isSupportTouch: isSupportTouch,
    hasCodeMirror: hasCodeMirror,
    isFontInstalled: isFontInstalled,
    isW3CRangeSupport: !!document.createRange
  };

  /**
   * @class core.func
   *
   * func utils (for high-order func's arg)
   *
   * @singleton
   * @alternateClassName func
   */
  var func = (function () {
    var eq = function (itemA) {
      return function (itemB) {
        return itemA === itemB;
      };
    };

    var eq2 = function (itemA, itemB) {
      return itemA === itemB;
    };

    var peq2 = function (propName) {
      return function (itemA, itemB) {
        return itemA[propName] === itemB[propName];
      };
    };

    var ok = function () {
      return true;
    };

    var fail = function () {
      return false;
    };

    var not = function (f) {
      return function () {
        return !f.apply(f, arguments);
      };
    };

    var and = function (fA, fB) {
      return function (item) {
        return fA(item) && fB(item);
      };
    };

    var self = function (a) {
      return a;
    };

    var invoke = function (obj, method) {
      return function () {
        return obj[method].apply(obj, arguments);
      };
    };

    var idCounter = 0;

    /**
     * generate a globally-unique id
     *
     * @param {String} [prefix]
     */
    var uniqueId = function (prefix) {
      var id = ++idCounter + '';
      return prefix ? prefix + id : id;
    };

    /**
     * returns bnd (bounds) from rect
     *
     * - IE Compatibility Issue: http://goo.gl/sRLOAo
     * - Scroll Issue: http://goo.gl/sNjUc
     *
     * @param {Rect} rect
     * @return {Object} bounds
     * @return {Number} bounds.top
     * @return {Number} bounds.left
     * @return {Number} bounds.width
     * @return {Number} bounds.height
     */
    var rect2bnd = function (rect) {
      var $document = $(document);
      return {
        top: rect.top + $document.scrollTop(),
        left: rect.left + $document.scrollLeft(),
        width: rect.right - rect.left,
        height: rect.bottom - rect.top
      };
    };

    /**
     * returns a copy of the object where the keys have become the values and the values the keys.
     * @param {Object} obj
     * @return {Object}
     */
    var invertObject = function (obj) {
      var inverted = {};
      for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
          inverted[obj[key]] = key;
        }
      }
      return inverted;
    };

    /**
     * @param {String} namespace
     * @param {String} [prefix]
     * @return {String}
     */
    var namespaceToCamel = function (namespace, prefix) {
      prefix = prefix || '';
      return prefix + namespace.split('.').map(function (name) {
        return name.substring(0, 1).toUpperCase() + name.substring(1);
      }).join('');
    };

    /**
     * Returns a function, that, as long as it continues to be invoked, will not
     * be triggered. The function will be called after it stops being called for
     * N milliseconds. If `immediate` is passed, trigger the function on the
     * leading edge, instead of the trailing.
     * @param {Function} func
     * @param {Number} wait
     * @param {Boolean} immediate
     * @return {Function}
     */
    var debounce = function (func, wait, immediate) {
      var timeout;
      return function () {
        var context = this, args = arguments;
        var later = function () {
          timeout = null;
          if (!immediate) {
            func.apply(context, args);
          }
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
          func.apply(context, args);
        }
      };
    };

    return {
      eq: eq,
      eq2: eq2,
      peq2: peq2,
      ok: ok,
      fail: fail,
      self: self,
      not: not,
      and: and,
      invoke: invoke,
      uniqueId: uniqueId,
      rect2bnd: rect2bnd,
      invertObject: invertObject,
      namespaceToCamel: namespaceToCamel,
      debounce: debounce
    };
  })();

  /**
   * @class core.list
   *
   * list utils
   *
   * @singleton
   * @alternateClassName list
   */
  var list = (function () {
    /**
     * returns the first item of an array.
     *
     * @param {Array} array
     */
    var head = function (array) {
      return array[0];
    };

    /**
     * returns the last item of an array.
     *
     * @param {Array} array
     */
    var last = function (array) {
      return array[array.length - 1];
    };

    /**
     * returns everything but the last entry of the array.
     *
     * @param {Array} array
     */
    var initial = function (array) {
      return array.slice(0, array.length - 1);
    };

    /**
     * returns the rest of the items in an array.
     *
     * @param {Array} array
     */
    var tail = function (array) {
      return array.slice(1);
    };

    /**
     * returns item of array
     */
    var find = function (array, pred) {
      for (var idx = 0, len = array.length; idx < len; idx ++) {
        var item = array[idx];
        if (pred(item)) {
          return item;
        }
      }
    };

    /**
     * returns true if all of the values in the array pass the predicate truth test.
     */
    var all = function (array, pred) {
      for (var idx = 0, len = array.length; idx < len; idx ++) {
        if (!pred(array[idx])) {
          return false;
        }
      }
      return true;
    };

    /**
     * returns index of item
     */
    var indexOf = function (array, item) {
      return $.inArray(item, array);
    };

    /**
     * returns true if the value is present in the list.
     */
    var contains = function (array, item) {
      return indexOf(array, item) !== -1;
    };

    /**
     * get sum from a list
     *
     * @param {Array} array - array
     * @param {Function} fn - iterator
     */
    var sum = function (array, fn) {
      fn = fn || func.self;
      return array.reduce(function (memo, v) {
        return memo + fn(v);
      }, 0);
    };

    /**
     * returns a copy of the collection with array type.
     * @param {Collection} collection - collection eg) node.childNodes, ...
     */
    var from = function (collection) {
      var result = [], idx = -1, length = collection.length;
      while (++idx < length) {
        result[idx] = collection[idx];
      }
      return result;
    };

    /**
     * returns whether list is empty or not
     */
    var isEmpty = function (array) {
      return !array || !array.length;
    };

    /**
     * cluster elements by predicate function.
     *
     * @param {Array} array - array
     * @param {Function} fn - predicate function for cluster rule
     * @param {Array[]}
     */
    var clusterBy = function (array, fn) {
      if (!array.length) { return []; }
      var aTail = tail(array);
      return aTail.reduce(function (memo, v) {
        var aLast = last(memo);
        if (fn(last(aLast), v)) {
          aLast[aLast.length] = v;
        } else {
          memo[memo.length] = [v];
        }
        return memo;
      }, [[head(array)]]);
    };

    /**
     * returns a copy of the array with all false values removed
     *
     * @param {Array} array - array
     * @param {Function} fn - predicate function for cluster rule
     */
    var compact = function (array) {
      var aResult = [];
      for (var idx = 0, len = array.length; idx < len; idx ++) {
        if (array[idx]) { aResult.push(array[idx]); }
      }
      return aResult;
    };

    /**
     * produces a duplicate-free version of the array
     *
     * @param {Array} array
     */
    var unique = function (array) {
      var results = [];

      for (var idx = 0, len = array.length; idx < len; idx ++) {
        if (!contains(results, array[idx])) {
          results.push(array[idx]);
        }
      }

      return results;
    };

    /**
     * returns next item.
     * @param {Array} array
     */
    var next = function (array, item) {
      var idx = indexOf(array, item);
      if (idx === -1) { return null; }

      return array[idx + 1];
    };

    /**
     * returns prev item.
     * @param {Array} array
     */
    var prev = function (array, item) {
      var idx = indexOf(array, item);
      if (idx === -1) { return null; }

      return array[idx - 1];
    };

    return { head: head, last: last, initial: initial, tail: tail,
             prev: prev, next: next, find: find, contains: contains,
             all: all, sum: sum, from: from, isEmpty: isEmpty,
             clusterBy: clusterBy, compact: compact, unique: unique };
  })();


    var NBSP_CHAR = String.fromCharCode(160);
    var ZERO_WIDTH_NBSP_CHAR = '\ufeff';

    /**
    * @class core.dom
    *
    * Dom functions
    *
    * @singleton
    * @alternateClassName dom
    */
    var dom = (function () {
        /**
        * @method isEditable
        *
        * returns whether node is `note-editable` or not.
        *
        * @param {Node} node
        * @return {Boolean}
        */
        var isEditable = function (node) {
            return node && $(node).hasClass('note-editable');
        };

        /**
        * @method isControlSizing
        *
        * returns whether node is `note-control-sizing` or not.
        *
        * @param {Node} node
        * @return {Boolean}
        */
        var isControlSizing = function (node) {
            return node && $(node).hasClass('note-control-sizing');
        };

        /**
        * @method makePredByNodeName
        *
        * returns predicate which judge whether nodeName is same
        *
        * @param {String} nodeName
        * @return {Function}
        */
        var makePredByNodeName = function (nodeName) {
            nodeName = nodeName.toUpperCase();
            return function (node) {
                if (node !== undefined && node.nodeName !== undefined) {
                    return node && node.nodeName.toUpperCase() === nodeName;
                }
                return false;
            };
        };

        /**
        * @method isText
        *
        *
        *
        * @param {Node} node
        * @return {Boolean} true if node's type is text(3)
        */
        var isText = function (node) {
            return node && node.nodeType === 3;
        };

        /**
        * @method isElement
        *
        *
        *
        * @param {Node} node
        * @return {Boolean} true if node's type is element(1)
        */
        var isElement = function (node) {
            return node && node.nodeType === 1;
        };

        /**
        * ex) br, col, embed, hr, img, input, ...
        * @see http://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
        */
        var isVoid = function (node) {
            return node && /^BR|^IMG|^HR|^IFRAME|^BUTTON|^INPUT/.test(node.nodeName.toUpperCase());
        };

        var isPara = function (node) {
            if (isEditable(node)) {
                return false;
            }

            // Chrome(v31.0), FF(v25.0.1) use DIV for paragraph
            return node && /^DIV|^P|^LI|^H[1-7]/.test(node.nodeName.toUpperCase());
        };

        var isHeading = function (node) {
            return node && /^H[1-7]/.test(node.nodeName.toUpperCase());
        };

        var isPre = makePredByNodeName('PRE');

        var isLi = makePredByNodeName('LI');

        var isPurePara = function (node) {
            return isPara(node) && !isLi(node);
        };

        var isTable = makePredByNodeName('TABLE');

        var isData = makePredByNodeName('DATA');

        var isInline = function (node) {
            return !isBodyContainer(node) &&
            !isList(node) &&
            !isHr(node) &&
            !isPara(node) &&
            !isTable(node) &&
            !isBlockquote(node) &&
            !isData(node);
        };

        var isList = function (node) {
            return node && /^UL|^OL/.test(node.nodeName.toUpperCase());
        };

        var isHr = makePredByNodeName('HR');

        var isCell = function (node) {
            if (node !== undefined && node.nodeName !== undefined) {
                return node && /^TD|^TH/.test(node.nodeName.toUpperCase());
            }
            return false;
        };

        var isBlockquote = makePredByNodeName('BLOCKQUOTE');

        var isBodyContainer = function (node) {
            return isCell(node) || isBlockquote(node) || isEditable(node);
        };

        var isAnchor = makePredByNodeName('A');

        var isParaInline = function (node) {
            return isInline(node) && !!ancestor(node, isPara);
        };

        var isBodyInline = function (node) {
            return isInline(node) && !ancestor(node, isPara);
        };

        var isBody = makePredByNodeName('BODY');

        /**
        * returns whether nodeB is closest sibling of nodeA
        *
        * @param {Node} nodeA
        * @param {Node} nodeB
        * @return {Boolean}
        */
        var isClosestSibling = function (nodeA, nodeB) {
            return nodeA.nextSibling === nodeB ||
            nodeA.previousSibling === nodeB;
        };

        /**
        * returns array of closest siblings with node
        *
        * @param {Node} node
        * @param {function} [pred] - predicate function
        * @return {Node[]}
        */
        var withClosestSiblings = function (node, pred) {
            pred = pred || func.ok;

            var siblings = [];
            if (node.previousSibling && pred(node.previousSibling)) {
                siblings.push(node.previousSibling);
            }
            siblings.push(node);
            if (node.nextSibling && pred(node.nextSibling)) {
                siblings.push(node.nextSibling);
            }
            return siblings;
        };

        /**
        * blank HTML for cursor position
        * - [workaround] old IE only works with &nbsp;
        * - [workaround] IE11 and other browser works with bogus br
        */
        var blankHTML = agent.isMSIE && agent.browserVersion < 11 ? '&nbsp;' : '<br>';

        /**
        * @method nodeLength
        *
        * returns #text's text size or element's childNodes size
        *
        * @param {Node} node
        */
        var nodeLength = function (node) {
            if (isText(node)) {
                return node.nodeValue.length;
            }

            if (node) {
                return node.childNodes.length;
            }

            return 0;

        };

        /**
        * returns whether node is empty or not.
        *
        * @param {Node} node
        * @return {Boolean}
        */
        var isEmpty = function (node) {
            var len = nodeLength(node);

            if (len === 0) {
                return true;
            } else if (!isText(node) && len === 1 && node.innerHTML === blankHTML) {
                // ex) <p><br></p>, <span><br></span>
                return true;
            } else if (list.all(node.childNodes, isText) && node.innerHTML === '') {
                // ex) <p></p>, <span></span>
                return true;
            }

            return false;
        };

        /**
        * padding blankHTML if node is empty (for cursor position)
        */
        var paddingBlankHTML = function (node) {
            if (!isVoid(node) && !nodeLength(node)) {
                node.innerHTML = blankHTML;
            }
        };

        /**
        * find nearest ancestor predicate hit
        *
        * @param {Node} node
        * @param {Function} pred - predicate function
        */
        var ancestor = function (node, pred) {
            while (node) {
                if (pred(node)) { return node; }
                if (isEditable(node)) { break; }

                node = node.parentNode;
            }
            return null;
        };

        /**
        * find nearest ancestor only single child blood line and predicate hit
        *
        * @param {Node} node
        * @param {Function} pred - predicate function
        */
        var singleChildAncestor = function (node, pred) {
            node = node.parentNode;

            while (node) {
                if (nodeLength(node) !== 1) { break; }
                if (pred(node)) { return node; }
                if (isEditable(node)) { break; }

                node = node.parentNode;
            }
            return null;
        };

        /**
        * returns new array of ancestor nodes (until predicate hit).
        *
        * @param {Node} node
        * @param {Function} [optional] pred - predicate function
        */
        var listAncestor = function (node, pred) {
            pred = pred || func.fail;

            var ancestors = [];
            ancestor(node, function (el) {
                if (!isEditable(el)) {
                    ancestors.push(el);
                }

                return pred(el);
            });
            return ancestors;
        };

        /**
        * find farthest ancestor predicate hit
        */
        var lastAncestor = function (node, pred) {
            var ancestors = listAncestor(node);
            return list.last(ancestors.filter(pred));
        };

        /**
        * returns common ancestor node between two nodes.
        *
        * @param {Node} nodeA
        * @param {Node} nodeB
        */
        var commonAncestor = function (nodeA, nodeB) {
            var ancestors = listAncestor(nodeA);
            for (var n = nodeB; n; n = n.parentNode) {
                if ($.inArray(n, ancestors) > -1) { return n; }
            }
            return null; // difference document area
        };

        /**
        * listing all previous siblings (until predicate hit).
        *
        * @param {Node} node
        * @param {Function} [optional] pred - predicate function
        */
        var listPrev = function (node, pred) {
            pred = pred || func.fail;

            var nodes = [];
            while (node) {
                if (pred(node)) { break; }
                nodes.push(node);
                node = node.previousSibling;
            }
            return nodes;
        };

        /**
        * listing next siblings (until predicate hit).
        *
        * @param {Node} node
        * @param {Function} [pred] - predicate function
        */
        var listNext = function (node, pred) {
            pred = pred || func.fail;

            var nodes = [];
            while (node) {
                if (pred(node)) { break; }
                nodes.push(node);
                node = node.nextSibling;
            }
            return nodes;
        };

        /**
        * listing descendant nodes
        *
        * @param {Node} node
        * @param {Function} [pred] - predicate function
        */
        var listDescendant = function (node, pred) {
            var descendants = [];
            pred = pred || func.ok;

            // start DFS(depth first search) with node
            (function fnWalk(current) {
                if (node !== current && pred(current)) {
                    descendants.push(current);
                }
                for (var idx = 0, len = current.childNodes.length; idx < len; idx++) {
                    fnWalk(current.childNodes[idx]);
                }
            })(node);

            return descendants;
        };

        /**
        * wrap node with new tag.
        *
        * @param {Node} node
        * @param {Node} tagName of wrapper
        * @return {Node} - wrapper
        */
        var wrap = function (node, wrapperName) {
            var parent = node.parentNode;
            var wrapper = $('<' + wrapperName + '>')[0];

            parent.insertBefore(wrapper, node);
            wrapper.appendChild(node);

            return wrapper;
        };

        /**
        * insert node after preceding
        *
        * @param {Node} node
        * @param {Node} preceding - predicate function
        */
        var insertAfter = function (node, preceding) {
            var next = preceding.nextSibling, parent = preceding.parentNode;
            if (next) {
                parent.insertBefore(node, next);
            } else {
                parent.appendChild(node);
            }
            return node;
        };

        /**
        * append elements.
        *
        * @param {Node} node
        * @param {Collection} aChild
        */
        var appendChildNodes = function (node, aChild) {
            $.each(aChild, function (idx, child) {
                node.appendChild(child);
            });
            return node;
        };

        /**
        * returns whether boundaryPoint is left edge or not.
        *
        * @param {BoundaryPoint} point
        * @return {Boolean}
        */
        var isLeftEdgePoint = function (point) {
            return point.offset === 0;
        };

        /**
        * returns whether boundaryPoint is right edge or not.
        *
        * @param {BoundaryPoint} point
        * @return {Boolean}
        */
        var isRightEdgePoint = function (point) {
            return point.offset === nodeLength(point.node);
        };

        /**
        * returns whether boundaryPoint is edge or not.
        *
        * @param {BoundaryPoint} point
        * @return {Boolean}
        */
        var isEdgePoint = function (point) {
            return isLeftEdgePoint(point) || isRightEdgePoint(point);
        };

        /**
        * returns whether node is left edge of ancestor or not.
        *
        * @param {Node} node
        * @param {Node} ancestor
        * @return {Boolean}
        */
        var isLeftEdgeOf = function (node, ancestor) {
            while (node && node !== ancestor) {
                if (position(node) !== 0) {
                    return false;
                }
                node = node.parentNode;
            }

            return true;
        };

        /**
        * returns whether node is right edge of ancestor or not.
        *
        * @param {Node} node
        * @param {Node} ancestor
        * @return {Boolean}
        */
        var isRightEdgeOf = function (node, ancestor) {
            if (!ancestor) {
                return false;
            }
            while (node && node !== ancestor) {
                if (position(node) !== nodeLength(node.parentNode) - 1) {
                    return false;
                }
                node = node.parentNode;
            }

            return true;
        };

        /**
        * returns whether point is left edge of ancestor or not.
        * @param {BoundaryPoint} point
        * @param {Node} ancestor
        * @return {Boolean}
        */
        var isLeftEdgePointOf = function (point, ancestor) {
            return isLeftEdgePoint(point) && isLeftEdgeOf(point.node, ancestor);
        };

        /**
        * returns whether point is right edge of ancestor or not.
        * @param {BoundaryPoint} point
        * @param {Node} ancestor
        * @return {Boolean}
        */
        var isRightEdgePointOf = function (point, ancestor) {
            return isRightEdgePoint(point) && isRightEdgeOf(point.node, ancestor);
        };

        /**
        * returns offset from parent.
        *
        * @param {Node} node
        */
        var position = function (node) {
            var offset = 0;
            while ((node = node.previousSibling)) {
                offset += 1;
            }
            return offset;
        };

        var hasChildren = function (node) {
            return !!(node && node.childNodes && node.childNodes.length);
        };

        /**
        * returns previous boundaryPoint
        *
        * @param {BoundaryPoint} point
        * @param {Boolean} isSkipInnerOffset
        * @return {BoundaryPoint}
        */
        var prevPoint = function (point, isSkipInnerOffset) {
            var node, offset;

            if (point.offset === 0) {
                if (isEditable(point.node)) {
                    return null;
                }

                node = point.node.parentNode;
                offset = position(point.node);
            } else if (hasChildren(point.node)) {
                node = point.node.childNodes[point.offset - 1];
                offset = nodeLength(node);
            } else {
                node = point.node;
                offset = isSkipInnerOffset ? 0 : point.offset - 1;
            }

            return {
                node: node,
                offset: offset
            };
        };

        /**
        * returns next boundaryPoint
        *
        * @param {BoundaryPoint} point
        * @param {Boolean} isSkipInnerOffset
        * @return {BoundaryPoint}
        */
        var nextPoint = function (point, isSkipInnerOffset) {
            var node, offset;

            if (nodeLength(point.node) === point.offset) {
                if (isEditable(point.node)) {
                    return null;
                }

                node = point.node.parentNode;
                offset = position(point.node) + 1;
            } else if (hasChildren(point.node)) {
                node = point.node.childNodes[point.offset];
                offset = 0;
            } else {
                node = point.node;
                offset = isSkipInnerOffset ? nodeLength(point.node) : point.offset + 1;
            }

            return {
                node: node,
                offset: offset
            };
        };

        /**
        * returns whether pointA and pointB is same or not.
        *
        * @param {BoundaryPoint} pointA
        * @param {BoundaryPoint} pointB
        * @return {Boolean}
        */
        var isSamePoint = function (pointA, pointB) {
            return pointA.node === pointB.node && pointA.offset === pointB.offset;
        };

        /**
        * returns whether point is visible (can set cursor) or not.
        *
        * @param {BoundaryPoint} point
        * @return {Boolean}
        */
        var isVisiblePoint = function (point) {
            if (isText(point.node) || !hasChildren(point.node) || isEmpty(point.node)) {
                return true;
            }

            var leftNode = point.node.childNodes[point.offset - 1];
            var rightNode = point.node.childNodes[point.offset];
            if ((!leftNode || isVoid(leftNode)) && (!rightNode || isVoid(rightNode))) {
                return true;
            }

            return false;
        };

        /**
        * @method prevPointUtil
        *
        * @param {BoundaryPoint} point
        * @param {Function} pred
        * @return {BoundaryPoint}
        */
        var prevPointUntil = function (point, pred) {
            while (point) {
                if (pred(point)) {
                    return point;
                }

                point = prevPoint(point);
            }

            return null;
        };

        /**
        * @method nextPointUntil
        *
        * @param {BoundaryPoint} point
        * @param {Function} pred
        * @return {BoundaryPoint}
        */
        var nextPointUntil = function (point, pred) {
            while (point) {
                if (pred(point)) {
                    return point;
                }

                point = nextPoint(point);
            }

            return null;
        };

        /**
        * returns whether point has character or not.
        *
        * @param {Point} point
        * @return {Boolean}
        */
        var isCharPoint = function (point) {
            if (!isText(point.node)) {
                return false;
            }

            var ch = point.node.nodeValue.charAt(point.offset - 1);
            return ch && (ch !== ' ' && ch !== NBSP_CHAR);
        };

        /**
        * @method walkPoint
        *
        * @param {BoundaryPoint} startPoint
        * @param {BoundaryPoint} endPoint
        * @param {Function} handler
        * @param {Boolean} isSkipInnerOffset
        */
        var walkPoint = function (startPoint, endPoint, handler, isSkipInnerOffset) {
            var point = startPoint;

            while (point) {
                handler(point);

                if (isSamePoint(point, endPoint)) {
                    break;
                }

                var isSkipOffset = isSkipInnerOffset &&
                startPoint.node !== point.node &&
                endPoint.node !== point.node;
                point = nextPoint(point, isSkipOffset);
            }
        };

        /**
        * @method makeOffsetPath
        *
        * return offsetPath(array of offset) from ancestor
        *
        * @param {Node} ancestor - ancestor node
        * @param {Node} node
        */
        var makeOffsetPath = function (ancestor, node) {
            var ancestors = listAncestor(node, func.eq(ancestor));
            return ancestors.map(position).reverse();
        };

        /**
        * @method fromOffsetPath
        *
        * return element from offsetPath(array of offset)
        *
        * @param {Node} ancestor - ancestor node
        * @param {array} offsets - offsetPath
        */
        var fromOffsetPath = function (ancestor, offsets) {
            var current = ancestor;
            for (var i = 0, len = offsets.length; i < len; i++) {
                if (current.childNodes.length <= offsets[i]) {
                    current = current.childNodes[current.childNodes.length - 1];
                } else {
                    current = current.childNodes[offsets[i]];
                }
            }
            return current;
        };

        /**
        * @method splitNode
        *
        * split element or #text
        *
        * @param {BoundaryPoint} point
        * @param {Object} [options]
        * @param {Boolean} [options.isSkipPaddingBlankHTML] - default: false
        * @param {Boolean} [options.isNotSplitEdgePoint] - default: false
        * @return {Node} right node of boundaryPoint
        */
        var splitNode = function (point, options) {
            var isSkipPaddingBlankHTML = options && options.isSkipPaddingBlankHTML;
            var isNotSplitEdgePoint = options && options.isNotSplitEdgePoint;

            // edge case
            if (isEdgePoint(point) && (isText(point.node) || isNotSplitEdgePoint)) {
                if (isLeftEdgePoint(point)) {
                    return point.node;
                } else if (isRightEdgePoint(point)) {
                    return point.node.nextSibling;
                }
            }

            // split #text
            if (isText(point.node)) {
                return point.node.splitText(point.offset);
            } else {
                var childNode = point.node.childNodes[point.offset];
                var clone = insertAfter(point.node.cloneNode(false), point.node);
                appendChildNodes(clone, listNext(childNode));

                if (!isSkipPaddingBlankHTML) {
                    paddingBlankHTML(point.node);
                    paddingBlankHTML(clone);
                }

                return clone;
            }
        };

        /**
        * @method splitTree
        *
        * split tree by point
        *
        * @param {Node} root - split root
        * @param {BoundaryPoint} point
        * @param {Object} [options]
        * @param {Boolean} [options.isSkipPaddingBlankHTML] - default: false
        * @param {Boolean} [options.isNotSplitEdgePoint] - default: false
        * @return {Node} right node of boundaryPoint
        */
        var splitTree = function (root, point, options) {
            // ex) [#text, <span>, <p>]
            var ancestors = listAncestor(point.node, func.eq(root));

            if (!ancestors.length) {
                return null;
            } else if (ancestors.length === 1) {
                return splitNode(point, options);
            }

            return ancestors.reduce(function (node, parent) {
                if (node === point.node) {
                    node = splitNode(point, options);
                }

                return splitNode({
                    node: parent,
                    offset: node ? dom.position(node) : nodeLength(parent)
                }, options);
            });
        };

        /**
        * split point
        *
        * @param {Point} point
        * @param {Boolean} isInline
        * @return {Object}
        */
        var splitPoint = function (point, isInline) {
            // find splitRoot, container
            //  - inline: splitRoot is a child of paragraph
            //  - block: splitRoot is a child of bodyContainer
            var pred = isInline ? isPara : isBodyContainer;
            var ancestors = listAncestor(point.node, pred);
            var topAncestor = list.last(ancestors) || point.node;

            var splitRoot, container;
            if (pred(topAncestor)) {
                splitRoot = ancestors[ancestors.length - 2];
                container = topAncestor;
            } else {
                splitRoot = topAncestor;
                container = splitRoot.parentNode;
            }

            // if splitRoot is exists, split with splitTree
            var pivot = splitRoot && splitTree(splitRoot, point, {
                isSkipPaddingBlankHTML: isInline,
                isNotSplitEdgePoint: isInline
            });

            // if container is point.node, find pivot with point.offset
            if (!pivot && container === point.node) {
                pivot = point.node.childNodes[point.offset];
            }

            return {
                rightNode: pivot,
                container: container
            };
        };

        var create = function (nodeName) {
            return document.createElement(nodeName);
        };

        var createText = function (text) {
            return document.createTextNode(text);
        };

        /**
        * @method remove
        *
        * remove node, (isRemoveChild: remove child or not)
        *
        * @param {Node} node
        * @param {Boolean} isRemoveChild
        */
        var remove = function (node, isRemoveChild) {
            if (!node || !node.parentNode) { return; }
            if (node.removeNode) { return node.removeNode(isRemoveChild); }

            var parent = node.parentNode;
            if (!isRemoveChild) {
                var nodes = [];
                var i, len;
                for (i = 0, len = node.childNodes.length; i < len; i++) {
                    nodes.push(node.childNodes[i]);
                }

                for (i = 0, len = nodes.length; i < len; i++) {
                    parent.insertBefore(nodes[i], node);
                }
            }

            parent.removeChild(node);
        };

        /**
        * @method removeWhile
        *
        * @param {Node} node
        * @param {Function} pred
        */
        var removeWhile = function (node, pred) {
            while (node) {
                if (isEditable(node) || !pred(node)) {
                    break;
                }

                var parent = node.parentNode;
                remove(node);
                node = parent;
            }
        };

        /**
        * @method replace
        *
        * replace node with provided nodeName
        *
        * @param {Node} node
        * @param {String} nodeName
        * @return {Node} - new node
        */
        var replace = function (node, nodeName) {
            if (node.nodeName.toUpperCase() === nodeName.toUpperCase()) {
                return node;
            }

            var newNode = create(nodeName);

            if (node.style.cssText) {
                newNode.style.cssText = node.style.cssText;
            }

            appendChildNodes(newNode, list.from(node.childNodes));
            insertAfter(newNode, node);
            remove(node);

            return newNode;
        };

        var isTextarea = makePredByNodeName('TEXTAREA');

        /**
        * @param {jQuery} $node
        * @param {Boolean} [stripLinebreaks] - default: false
        */
        var value = function ($node, stripLinebreaks) {
            var val = isTextarea($node[0]) ? $node.val() : $node.html();
            if (stripLinebreaks) {
                return val.replace(/[\n\r]/g, '');
            }
            return val;
        };

        /**
        * @method html
        *
        * get the HTML contents of node
        *
        * @param {jQuery} $node
        * @param {Boolean} [isNewlineOnBlock]
        */
        var html = function ($node, isNewlineOnBlock) {
            var markup = value($node);

            if (isNewlineOnBlock) {
                var regexTag = /<(\/?)(\b(?!!)[^>\s]*)(.*?)(\s*\/?>)/g;
                markup = markup.replace(regexTag, function (match, endSlash, name) {
                    name = name.toUpperCase();
                    var isEndOfInlineContainer = /^DIV|^TD|^TH|^P|^LI|^H[1-7]/.test(name) &&
                    !!endSlash;
                    var isBlockNode = /^BLOCKQUOTE|^TABLE|^TBODY|^TR|^HR|^UL|^OL/.test(name);

                    return match + ((isEndOfInlineContainer || isBlockNode) ? '\n' : '');
                });
                markup = $.trim(markup);
            }

            return markup;
        };

        var posFromPlaceholder = function (placeholder) {
            var $placeholder = $(placeholder);
            var pos = $placeholder.offset();
            var height = $placeholder.outerHeight(true); // include margin

            return {
                left: pos.left,
                top: pos.top + height
            };
        };

        var attachEvents = function ($node, events) {
            Object.keys(events).forEach(function (key) {
                $node.on(key, events[key]);
            });
        };

        var detachEvents = function ($node, events) {
            Object.keys(events).forEach(function (key) {
                $node.off(key, events[key]);
            });
        };

        /**
        * @method isCustomStyleTag
        *
        * assert if a node contains a "note-styletag" class,
        * which implies that's a custom-made style tag node
        *
        * @param {Node} an HTML DOM node
        */
        var isCustomStyleTag = function (node) {
            return node && !dom.isText(node) && list.contains(node.classList, 'note-styletag');
        };

        return {
            /** @property {String} NBSP_CHAR */
            NBSP_CHAR: NBSP_CHAR,
            /** @property {String} ZERO_WIDTH_NBSP_CHAR */
            ZERO_WIDTH_NBSP_CHAR: ZERO_WIDTH_NBSP_CHAR,
            /** @property {String} blank */
            blank: blankHTML,
            /** @property {String} emptyPara */
            emptyPara: '<p>' + blankHTML + '</p>',
            emptyTableCell: '(table)',
            emptyTableHeaderCell: '(header)',
            makePredByNodeName: makePredByNodeName,
            isEditable: isEditable,
            isControlSizing: isControlSizing,
            isText: isText,
            isElement: isElement,
            isVoid: isVoid,
            isPara: isPara,
            isPurePara: isPurePara,
            isHeading: isHeading,
            isInline: isInline,
            isBlock: func.not(isInline),
            isBodyInline: isBodyInline,
            isBody: isBody,
            isParaInline: isParaInline,
            isPre: isPre,
            isList: isList,
            isTable: isTable,
            isData: isData,
            isCell: isCell,
            isBlockquote: isBlockquote,
            isBodyContainer: isBodyContainer,
            isAnchor: isAnchor,
            isDiv: makePredByNodeName('DIV'),
            isLi: isLi,
            isBR: makePredByNodeName('BR'),
            isSpan: makePredByNodeName('SPAN'),
            isB: makePredByNodeName('B'),
            isU: makePredByNodeName('U'),
            isS: makePredByNodeName('S'),
            isI: makePredByNodeName('I'),
            isImg: makePredByNodeName('IMG'),
            isTextarea: isTextarea,
            isEmpty: isEmpty,
            isEmptyAnchor: func.and(isAnchor, isEmpty),
            isClosestSibling: isClosestSibling,
            withClosestSiblings: withClosestSiblings,
            nodeLength: nodeLength,
            isLeftEdgePoint: isLeftEdgePoint,
            isRightEdgePoint: isRightEdgePoint,
            isEdgePoint: isEdgePoint,
            isLeftEdgeOf: isLeftEdgeOf,
            isRightEdgeOf: isRightEdgeOf,
            isLeftEdgePointOf: isLeftEdgePointOf,
            isRightEdgePointOf: isRightEdgePointOf,
            prevPoint: prevPoint,
            nextPoint: nextPoint,
            isSamePoint: isSamePoint,
            isVisiblePoint: isVisiblePoint,
            prevPointUntil: prevPointUntil,
            nextPointUntil: nextPointUntil,
            isCharPoint: isCharPoint,
            walkPoint: walkPoint,
            ancestor: ancestor,
            singleChildAncestor: singleChildAncestor,
            listAncestor: listAncestor,
            lastAncestor: lastAncestor,
            listNext: listNext,
            listPrev: listPrev,
            listDescendant: listDescendant,
            commonAncestor: commonAncestor,
            wrap: wrap,
            insertAfter: insertAfter,
            appendChildNodes: appendChildNodes,
            position: position,
            hasChildren: hasChildren,
            makeOffsetPath: makeOffsetPath,
            fromOffsetPath: fromOffsetPath,
            splitTree: splitTree,
            splitPoint: splitPoint,
            create: create,
            createText: createText,
            remove: remove,
            removeWhile: removeWhile,
            replace: replace,
            html: html,
            value: value,
            posFromPlaceholder: posFromPlaceholder,
            attachEvents: attachEvents,
            detachEvents: detachEvents,
            isCustomStyleTag: isCustomStyleTag
        };
    })();

    /**
    * @param {jQuery} $note
    * @param {Object} options
    * @return {Context}
    */
    var Context = function ($note, options) {
        var self = this;

        var ui = $.materialnote.ui;
        this.memos = {};
        this.modules = {};
        this.layoutInfo = {};
        this.options = options;

        /**
        * create layout and initialize modules and other resources
        */
        this.initialize = function () {
            this.layoutInfo = ui.createLayout($note, options);
            this._initialize();
            $note.hide();
            return this;
        };

        /**
        * destroy modules and other resources and remove layout
        */
        this.destroy = function () {
            this._destroy();
            $note.removeData('materialnote');
            ui.removeLayout($note, this.layoutInfo);
        };

        /**
        * destory modules and other resources and initialize it again
        */
        this.reset = function () {
            var disabled = self.isDisabled();
            this.code(dom.emptyPara);
            this._destroy();
            this._initialize();

            if (disabled) {
                self.disable();
            }
        };

        this._initialize = function () {
            // add optional buttons
            var buttons = $.extend({}, this.options.buttons);
            Object.keys(buttons).forEach(function (key) {
                self.memo('button.' + key, buttons[key]);
            });

            var modules = $.extend({}, this.options.modules, $.materialnote.plugins || {});

            // add and initialize modules
            Object.keys(modules).forEach(function (key) {
                self.module(key, modules[key], true);
            });

            Object.keys(this.modules).forEach(function (key) {
                self.initializeModule(key);
            });
        };

        this._destroy = function () {
            // destroy modules with reversed order
            Object.keys(this.modules).reverse().forEach(function (key) {
                self.removeModule(key);
            });

            Object.keys(this.memos).forEach(function (key) {
                self.removeMemo(key);
            });
            // trigger custom onDestroy callback
            this.triggerEvent('destroy', this);
        };

        this.code = function (html) {
            var isActivated = this.invoke('codeview.isActivated');

            if (html === undefined) {
                this.invoke('codeview.sync');
                return isActivated ? this.layoutInfo.codable.val() : this.layoutInfo.editable.html();
            } else {
                if (isActivated) {
                    this.layoutInfo.codable.val(html);
                } else {
                    this.layoutInfo.editable.html(html);
                }
                $note.val(html);
                this.triggerEvent('change', html);
            }
        };

        this.isDisabled = function () {
            return this.layoutInfo.editable.attr('contenteditable') === 'false';
        };

        this.enable = function () {
            this.layoutInfo.editable.attr('contenteditable', true);
            this.invoke('toolbar.activate', true);
            this.triggerEvent('disable', false);
        };

        this.disable = function () {
            // close codeview if codeview is opend
            if (this.invoke('codeview.isActivated')) {
                this.invoke('codeview.deactivate');
            }
            this.layoutInfo.editable.attr('contenteditable', false);
            this.invoke('toolbar.deactivate', true);

            this.triggerEvent('disable', true);
        };

        this.triggerEvent = function () {
            var namespace = list.head(arguments);
            var args = list.tail(list.from(arguments));

            var callback = this.options.callbacks[func.namespaceToCamel(namespace, 'on')];
            if (callback) {
                callback.apply($note[0], args);
            }
            $note.trigger('materialnote.' + namespace, args);
        };

        this.initializeModule = function (key) {
            var module = this.modules[key];
            module.shouldInitialize = module.shouldInitialize || func.ok;
            if (!module.shouldInitialize()) {
                return;
            }

            // initialize module
            if (module.initialize) {
                module.initialize();
            }

            // attach events
            if (module.events) {
                dom.attachEvents($note, module.events);
            }
        };

        this.module = function (key, ModuleClass, withoutIntialize) {
            if (arguments.length === 1) {
                return this.modules[key];
            }

            this.modules[key] = new ModuleClass(this);

            if (!withoutIntialize) {
                this.initializeModule(key);
            }
        };

        this.getInlineStyles = function($target) {
            var inlineStyle = $target.attr('style');
            var styles = {};

            if (inlineStyle) {
                inlineStyle = inlineStyle.split(';');

                for (let i = 0; i < inlineStyle.length; i++) {
                    if (inlineStyle[i] === '') {
                        continue;
                    }

                    let keyValue = inlineStyle[i].split(':');
                    let key = keyValue[0].trim();
                    let value = keyValue[1].trim();

                    styles[key] = value;
                }
            }

            return styles;
        };

        this.removeModule = function (key) {
            var module = this.modules[key];
            if (module.shouldInitialize()) {
                if (module.events) {
                    dom.detachEvents($note, module.events);
                }

                if (module.destroy) {
                    module.destroy();
                }
            }

            delete this.modules[key];
        };

        this.memo = function (key, obj) {
            if (arguments.length === 1) {
                return this.memos[key];
            }
            this.memos[key] = obj;
        };

        this.removeMemo = function (key) {
            if (this.memos[key] && this.memos[key].destroy) {
                this.memos[key].destroy();
            }

            delete this.memos[key];
        };

        /**
        *Some buttons need to change their visual style immediately once they get pressed
        */
        this.createInvokeHandlerAndUpdateState = function (namespace, value) {
            return function (event) {
                self.createInvokeHandler(namespace, value)(event);
                self.invoke('buttons.updateCurrentStyle');
            };
        };

        this.createInvokeHandler = function (namespace, value) {
            return function (event) {
                event.preventDefault();
                var $target = $(event.target);

                if (namespace === 'editor.insertTable') {
                    let optionsContainer = $target.closest('.row').prev();

                    value = {
                        dim: $target.closest('[data-value]').data('value'),
                        bordered: optionsContainer.find('#note-table-bordered').prop('checked'),
                        striped: optionsContainer.find('#note-table-striped').prop('checked'),
                        highlight: optionsContainer.find('#note-table-highlight').prop('checked'),
                        responsive: optionsContainer.find('#note-table-responsive').prop('checked'),
                        centered: optionsContainer.find('#note-table-centered').prop('checked')
                    };
                }

                self.invoke(namespace, value || $target.closest('[data-value]').data('value'), $target);
            };
        };

        this.invoke = function () {
            var namespace = list.head(arguments);
            var args = list.tail(list.from(arguments));
            var splits = namespace.split('.');
            var hasSeparator = splits.length > 1;
            var moduleName = hasSeparator && list.head(splits);
            var methodName = hasSeparator ? list.last(splits) : list.head(splits);
            var module = this.modules[moduleName || 'editor'];

            if (!moduleName && this[methodName]) {
                return this[methodName].apply(this, args);
            } else if (module && module[methodName] && module.shouldInitialize()) {
                return module[methodName].apply(module, args);
            }
        };

        return this.initialize();
    };

  $.fn.extend({
    /**
     * materialnote API
     *
     * @param {Object|String}
     * @return {this}
     */
    materialnote: function () {
      var type = $.type(list.head(arguments));
      var isExternalAPICalled = type === 'string';
      var hasInitOptions = type === 'object';

      var options = hasInitOptions ? list.head(arguments) : {};

      options = $.extend({}, $.materialnote.options, options);

      // Update options
      options.langInfo = $.extend(true, {}, $.materialnote.lang['en-US'], $.materialnote.lang[options.lang]);
      options.icons = $.extend(true, {}, $.materialnote.options.icons, options.icons);
      options.tooltip = options.tooltip === 'auto' ? !agent.isSupportTouch : options.tooltip;

      this.each(function (idx, note) {
        var $note = $(note);
        if (!$note.data('materialnote')) {
          var context = new Context($note, options);
          $note.data('materialnote', context);
          $note.data('materialnote').triggerEvent('init', context.layoutInfo);
        }
      });

      var $note = this.first();
      if ($note.length) {
        var context = $note.data('materialnote');
        if (isExternalAPICalled) {
          return context.invoke.apply(context, list.from(arguments));
        } else if (options.focus) {
          context.invoke('editor.focus');
        }
      }


      // activate plugins
      var $noteEditor = $note.next('.note-editor');
      $noteEditor.find('.dropdown-button').dropdown({
        inDuration: 300,
        outDuration: 225,
        constrainWidth: false, // Does not change width of dropdown to that of the activator
        //hover: true, // Activate on hover
        gutter: 0, // Spacing from edge
        belowOrigin: false, // Displays dropdown below the button
        alignment: 'left', // Displays dropdown with edge aligned to the left of button
        stopPropagation: false // Stops event propagation
      }
    );

      return this;
    }
  });


  var Renderer = function (markup, children, options, callback) {
    this.render = function ($parent) {
      var $node = $(markup);

      if (options && options.id) {
          //>>> add id to dropdown-content $element
          $node.attr('id', options.id);
      }

      if (options && options.contents) {
        $node.html(options.contents);
      }

      if (options && options.className) {
        $node.addClass(options.className);
      }

      if (options && options.data) {
        $.each(options.data, function (k, v) {
          $node.attr('data-' + k, v);
        });
      }

      if (options && options.click) {
        $node.on('click', options.click);
      }

      if (children) {
        var $container = $node.find('.note-children-container');
        children.forEach(function (child) {
          child.render($container.length ? $container : $node);
        });
      }

      if (callback) {
        callback($node, options);
      }

      if (options && options.callback) {
        options.callback($node);
      }

      if ($parent) {
        $parent.append($node);
      }

      return $node;
    };
  };

  var renderer = {
    create: function (markup, callback) {
      return function () {
        var children = $.isArray(arguments[0]) ? arguments[0] : [];
        var options = typeof arguments[1] === 'object' ? arguments[1] : arguments[0];
        if (options && options.children) {
          children = options.children;
        }
        return new Renderer(markup, children, options, callback);
      };
    }
  };

    var editor = renderer.create('<div class="note-editor note-frame panel panel-default"/>');
    var toolbar = renderer.create('<div class="note-toolbar-wrapper"><div class="note-toolbar panel-heading"></div></div>');
    var editingArea = renderer.create('<div class="note-editing-area"/>');
    var codable = renderer.create('<textarea class="note-codable"/>');
    var editable = renderer.create('<div class="note-editable panel-body" contentEditable="true"/>');
    var statusbar = renderer.create([
        '<div class="note-statusbar">',
        '  <div class="note-resizebar">',
        '    <div class="note-icon-bar"/>',
        '    <div class="note-icon-bar"/>',
        '    <div class="note-icon-bar"/>',
        '  </div>',
        '</div>'
    ].join(''));

    var airEditor = renderer.create('<div class="note-editor"/>');
    var airEditable = renderer.create('<div class="note-editable" contentEditable="true"/>');

    var buttonGroup = renderer.create('<div class="note-btn-group btn-group">');

    var dropdown = renderer.create('<div class="dropdown-content">', function ($node, options) {

        var markup = $.isArray(options.items) ? options.items.map(function (item) {
            var value = (typeof item === 'string') ? item : (item.value || '');
            var content = options.template ? options.template(item) : item;
            var option = (typeof item === 'object') ? item.option : undefined;

            var dataValue = 'data-value="' + value + '"';
            var dataOption = (option !== undefined) ? ' data-option="' + option + '"' : '';
            return '<li><a href="#" ' + (dataValue + dataOption) + '>' + content + '</a></li>';
        }).join('') : options.items;

        $node.html(markup);
    });

    var dropdownCheck = renderer.create('<div class="dropdown-content note-check">', function ($node, options) {
        var markup = $.isArray(options.items) ? options.items.map(function (item) {
            var value = (typeof item === 'string') ? item : (item.value || '');
            var content = options.template ? options.template(item) : item;
            return '<li><a href="#" data-value="' + value + '">' + icon(options.checkClassName) + ' ' + content + '</a></li>';
        }).join('') : options.items;
        $node.html(markup);
    });

    var palette = renderer.create('<div class="note-color-palette"/>', function ($node, options) {
        var contents = [];
        for (var row = 0, rowSize = options.colors.length; row < rowSize; row++) {
            var eventName = options.eventName;
            var colors = options.colors[row];
            var colorNames = options.colorNames[row];
            var buttons = [];
            for (var col = 0, colSize = colors.length; col < colSize; col++) {
                var color = colors[col];
                var colorName = colorNames[col];

                buttons.push([
                    '<button type="button" class="note-color-btn"',
                    'style="background-color:', color, '" ',
                    'data-event="', eventName, '" ',
                    'data-value="', color, '" ',
                    'data-description="', colorName, '" ',
                    'data-toggle="button" tabindex="-1"></button>'
                ].join(''));
            }
            contents.push('<div class="note-color-row">' + buttons.join('') + '</div>');
        }
        $node.html(contents.join(''));

        let $btns = $node.find('.note-color-btn').toArray();

        $btns.forEach(function(btn) {
            let $btn = $(btn);
            let hexColor = $btn.data('value');
            let colorDescription = $btn.data('description');

            $btn.tooltip({
                tooltip: hexColor,
                position: 'bottom',
                delay: 200
            });

            $btn.hover(function() {
                let $colorName = $(this).closest('.note-holder').prev('.row.noMargins').find('.color-name');

                $colorName.stop(true, false).fadeTo(150, 1.0, function() {
                    $colorName.html(colorDescription);
                });
            });

            $btn.mouseleave(function() {
                let $colorName = $(this).closest('.note-holder').prev('.row.noMargins').find('.color-name');

                $colorName.stop(true, false).fadeTo(150, 0);
            });
        });
    });

    var dialog = renderer.create('<div class="modal modal-fixed-footer" tabindex="-1"/>', function ($node, options) {
        if (options.fade) {
            $node.addClass('fade');
        }
        if (options.id) {
            $node.attr('id', options.id);
        }
        $node.html([
            '  <div class="modal-content">',
            (options.title ?
                '   <div class="row"><div class="col s12">' +
                '      <h4 class="modal-title">' + options.title + '</h4>' +
                '</div></div>' : ''
            ),
            options.body,
            '</div>',
            (options.footer ?
                '<div class="modal-footer">' +
                options.footer +
                '</div>' : ''
            )
        ].join(''));
    });

    var popover = renderer.create([
        '<div class="note-popover popover in">',
        '  <div class="arrow"/>',
        '  <div class="popover-content note-children-container"/>',
        '</div>'
    ].join(''), function ($node, options) {
        var direction = typeof options.direction !== 'undefined' ? options.direction : 'bottom';

        $node.addClass(direction);

        if (options.hideArrow) {
            $node.find('.arrow').hide();
        }
    });

    var icon = function (iconName, customClasses, tagName) {
        tagName = tagName || 'i';

        if (!customClasses) {
            customClasses = '';
        }
        return '<' + tagName + ' class="material-icons ' + customClasses + '">' + iconName + '</i>';
    };

    var ui = {
        editor: editor,
        toolbar: toolbar,
        editingArea: editingArea,
        codable: codable,
        editable: editable,
        statusbar: statusbar,
        airEditor: airEditor,
        airEditable: airEditable,
        buttonGroup: buttonGroup,
        dropdown: dropdown,
        dropdownCheck: dropdownCheck,
        palette: palette,
        dialog: dialog,
        popover: popover,
        icon: icon,
        options: {},

        colors: {
            backNameToText: function(colorName) {
                let colorTextName = [];

                colorName.split(' ').forEach(function(element, index) {
                    if (index === 0) {
                        element = element + '-text';
                    }
                    else {
                        element = 'text-' + element;
                    }

                    colorTextName[index] = element;
                });

                return colorTextName.join(' ');
            }
        },

        button: function ($node, options) {
            return renderer.create('<div class="note-btn btn waves-effect waves-light" tabindex="-1">', function ($node, options) {
                if (options && options.tooltip && self.options.tooltip) {
                    $node.attr({
                    }).tooltip({
                        tooltip: options.tooltip,
                        position: 'bottom',
                        delay: 200
                    });
                }
            })($node, options);
        },

        toggleBtn: function ($btn, isEnable) {
            $btn.toggleClass('disabled', !isEnable);
            $btn.attr('disabled', !isEnable);
        },

        toggleBtnActive: function ($btn, isActive) {
            $btn.toggleClass('active', isActive);
        },

        onDialogShown: function ($dialog, handler) {
            $dialog.one('shown.bs.modal', handler);
        },

        onDialogHidden: function ($dialog, handler) {
            $dialog.one('hidden.bs.modal', handler);
        },

        showDialog: function ($dialog) {
            $dialog.modal('open');
        },

        hideDialog: function ($dialog) {
            $dialog.modal('close');
        },

        createLayout: function ($note, options) {
            self.options = options;
            var $editor = (options.airMode ? ui.airEditor([
                ui.editingArea([
                    ui.airEditable()
                ])
            ]) : ui.editor([
                ui.toolbar(),
                ui.editingArea([
                    ui.codable(),
                    ui.editable()
                ]),
                ui.statusbar()
            ])).render();

            $editor.insertAfter($note);

            return {
                note: $note,
                editor: $editor,
                toolbar: $editor.find('.note-toolbar'),
                editingArea: $editor.find('.note-editing-area'),
                editable: $editor.find('.note-editable'),
                codable: $editor.find('.note-codable'),
                statusbar: $editor.find('.note-statusbar')
            };
        },

        removeLayout: function ($note, layoutInfo) {
            $note.html(layoutInfo.editable.html());
            layoutInfo.editor.remove();
            $note.show();
        }
    };

    $.materialnote = $.materialnote || {
        lang: {}
    };

    $.extend($.materialnote.lang, {
        'en-US': {
            font: {
                bold: 'Bold',
                italic: 'Italic',
                underline: 'Underline',
                clear: 'Remove Font Style',
                height: 'Line Height',
                name: 'Font Family',
                strikethrough: 'Strikethrough',
                subscript: 'Subscript',
                superscript: 'Superscript',
                size: 'Font Size'
            },
            image: {
                image: 'Picture',
                insert: 'Insert Image',
                resizeFull: 'Resize Full',
                resizeHalf: 'Resize Half',
                resizeQuarter: 'Resize Quarter',
                floatLeft: 'Float Left',
                floatRight: 'Float Right',
                floatNone: 'Float None',
                shapeRounded: 'Shape: Rounded',
                shapeCircle: 'Shape: Circle',
                shapeThumbnail: 'Shape: Thumbnail',
                shapeNone: 'Shape: None',
                dragImageHere: 'Drag image or text here',
                dropImage: 'Drop image or Text',
                selectFromFiles: 'Select from files',
                maximumFileSize: 'Maximum file size',
                maximumFileSizeError: 'Maximum file size exceeded.',
                url: 'Image URL',
                remove: 'Remove Image',
                responsive: 'Responsive'
            },
            video: {
                video: 'Video',
                videoLink: 'Video Link',
                insert: 'Insert Video',
                url: 'Video URL?',
                providers: '(YouTube, Vimeo, Vine, Instagram, DailyMotion or Youku)'
            },
            link: {
                link: 'Link',
                insert: 'Insert Link',
                unlink: 'Unlink',
                edit: 'Edit',
                textToDisplay: 'Text to display',
                url: 'To what URL should this link go?',
                openInNewWindow: 'Open in new window'
            },
            table: {
                table: 'Table',
                addRowAbove: 'Add row above',
                addRowBelow: 'Add row below',
                addColLeft: 'Add column left',
                addColRight: 'Add column right',
                delRow: 'Delete row',
                delCol: 'Delete column',
                delTable: 'Delete table',
                bordered: 'Bordered',
                striped: 'Striped',
                highlight: 'Highlight',
                responsive: 'Responsive',
                centered: 'Centered'
            },
            materializeComponents: {
                card: {
                    card: 'Card',
                    insert: 'Insert card',
                    cardContentSample: 'Card content'
                }
            },
            hr: {
                insert: 'Insert Horizontal Rule'
            },
            style: {
                style: 'Style',
                p: 'Normal',
                blockquote: 'Quote',
                pre: 'Code',
                h1: 'Header 1',
                h2: 'Header 2',
                h3: 'Header 3',
                h4: 'Header 4',
                h5: 'Header 5',
                h6: 'Header 6'
            },
            lists: {
                unordered: 'Unordered list',
                ordered: 'Ordered list'
            },
            options: {
                help: 'Help',
                fullscreen: 'Full Screen',
                codeview: 'Code View'
            },
            paragraph: {
                paragraph: 'Paragraph',
                outdent: 'Outdent',
                indent: 'Indent',
                left: 'Align left',
                center: 'Align center',
                right: 'Align right',
                justify: 'Justify full'
            },
            color: {
                recent: 'Recent Color',
                more: 'More Color',
                background: 'Background',
                foreground: 'Foreground',
                transparent: 'Transparent',
                setTransparent: 'Set transparent',
                reset: 'Reset',
                resetToDefault: 'Reset to default'
            },
            shortcut: {
                shortcuts: 'Keyboard shortcuts',
                close: 'Close',
                textFormatting: 'Text formatting',
                action: 'Action',
                paragraphFormatting: 'Paragraph formatting',
                documentStyle: 'Document Style',
                extraKeys: 'Extra keys'
            },
            help: {
                'insertParagraph': 'Insert Paragraph',
                'undo': 'Undoes the last command',
                'redo': 'Redoes the last command',
                'tab': 'Tab',
                'untab': 'Untab',
                'bold': 'Set a bold style',
                'italic': 'Set a italic style',
                'underline': 'Set a underline style',
                'strikethrough': 'Set a strikethrough style',
                'removeFormat': 'Clean a style',
                'justifyLeft': 'Set left align',
                'justifyCenter': 'Set center align',
                'justifyRight': 'Set right align',
                'justifyFull': 'Set full align',
                'insertUnorderedList': 'Toggle unordered list',
                'insertOrderedList': 'Toggle ordered list',
                'outdent': 'Outdent on current paragraph',
                'indent': 'Indent on current paragraph',
                'formatPara': 'Change current block\'s format as a paragraph(P tag)',
                'formatH1': 'Change current block\'s format as H1',
                'formatH2': 'Change current block\'s format as H2',
                'formatH3': 'Change current block\'s format as H3',
                'formatH4': 'Change current block\'s format as H4',
                'formatH5': 'Change current block\'s format as H5',
                'formatH6': 'Change current block\'s format as H6',
                'insertHorizontalRule': 'Insert horizontal rule',
                'linkDialog.show': 'Show Link Dialog',
                project: 'Project',
                issues: 'Issues'
            },
            history: {
                undo: 'Undo',
                redo: 'Redo'
            },
            specialChar: {
                specialChar: 'SPECIAL CHARACTERS',
                select: 'Select Special characters'
            }
        }
    });


  /**
   * @class core.key
   *
   * Object for keycodes.
   *
   * @singleton
   * @alternateClassName key
   */
  var key = (function () {
    var keyMap = {
      'BACKSPACE': 8,
      'TAB': 9,
      'ENTER': 13,
      'SPACE': 32,
      'DELETE': 46,

      // Arrow
      'LEFT': 37,
      'UP': 38,
      'RIGHT': 39,
      'DOWN': 40,

      // Number: 0-9
      'NUM0': 48,
      'NUM1': 49,
      'NUM2': 50,
      'NUM3': 51,
      'NUM4': 52,
      'NUM5': 53,
      'NUM6': 54,
      'NUM7': 55,
      'NUM8': 56,

      // Alphabet: a-z
      'B': 66,
      'E': 69,
      'I': 73,
      'J': 74,
      'K': 75,
      'L': 76,
      'R': 82,
      'S': 83,
      'U': 85,
      'V': 86,
      'Y': 89,
      'Z': 90,

      'SLASH': 191,
      'LEFTBRACKET': 219,
      'BACKSLASH': 220,
      'RIGHTBRACKET': 221
    };

    return {
      /**
       * @method isEdit
       *
       * @param {Number} keyCode
       * @return {Boolean}
       */
      isEdit: function (keyCode) {
        return list.contains([
          keyMap.BACKSPACE,
          keyMap.TAB,
          keyMap.ENTER,
          keyMap.SPACE,
          keyMap.DELETE
        ], keyCode);
      },
      /**
       * @method isMove
       *
       * @param {Number} keyCode
       * @return {Boolean}
       */
      isMove: function (keyCode) {
        return list.contains([
          keyMap.LEFT,
          keyMap.UP,
          keyMap.RIGHT,
          keyMap.DOWN
        ], keyCode);
      },
      /**
       * @property {Object} nameFromCode
       * @property {String} nameFromCode.8 "BACKSPACE"
       */
      nameFromCode: func.invertObject(keyMap),
      code: keyMap
    };
  })();

    var range = (function () {

        /**
        * return boundaryPoint from TextRange, inspired by Andy Na's HuskyRange.js
        *
        * @param {TextRange} textRange
        * @param {Boolean} isStart
        * @return {BoundaryPoint}
        *
        * @see http://msdn.microsoft.com/en-us/library/ie/ms535872(v=vs.85).aspx
        */
        var textRangeToPoint = function (textRange, isStart) {
            var container = textRange.parentElement(), offset;

            var tester = document.body.createTextRange(), prevContainer;
            var childNodes = list.from(container.childNodes);
            for (offset = 0; offset < childNodes.length; offset++) {
                if (dom.isText(childNodes[offset])) {
                    continue;
                }
                tester.moveToElementText(childNodes[offset]);
                if (tester.compareEndPoints('StartToStart', textRange) >= 0) {
                    break;
                }
                prevContainer = childNodes[offset];
            }

            if (offset !== 0 && dom.isText(childNodes[offset - 1])) {
                var textRangeStart = document.body.createTextRange(), curTextNode = null;
                textRangeStart.moveToElementText(prevContainer || container);
                textRangeStart.collapse(!prevContainer);
                curTextNode = prevContainer ? prevContainer.nextSibling : container.firstChild;

                var pointTester = textRange.duplicate();
                pointTester.setEndPoint('StartToStart', textRangeStart);
                var textCount = pointTester.text.replace(/[\r\n]/g, '').length;

                while (textCount > curTextNode.nodeValue.length && curTextNode.nextSibling) {
                    textCount -= curTextNode.nodeValue.length;
                    curTextNode = curTextNode.nextSibling;
                }

                /* jshint ignore:start */
                var dummy = curTextNode.nodeValue; // enforce IE to re-reference curTextNode, hack
                /* jshint ignore:end */

                if (isStart && curTextNode.nextSibling && dom.isText(curTextNode.nextSibling) &&
                textCount === curTextNode.nodeValue.length) {
                    textCount -= curTextNode.nodeValue.length;
                    curTextNode = curTextNode.nextSibling;
                }

                container = curTextNode;
                offset = textCount;
            }

            return {
                cont: container,
                offset: offset
            };
        };

        /**
        * return TextRange from boundary point (inspired by google closure-library)
        * @param {BoundaryPoint} point
        * @return {TextRange}
        */
        var pointToTextRange = function (point) {
            var textRangeInfo = function (container, offset) {
                var node, isCollapseToStart;

                if (dom.isText(container)) {
                    var prevTextNodes = dom.listPrev(container, func.not(dom.isText));
                    var prevContainer = list.last(prevTextNodes).previousSibling;
                    node =  prevContainer || container.parentNode;
                    offset += list.sum(list.tail(prevTextNodes), dom.nodeLength);
                    isCollapseToStart = !prevContainer;
                } else {
                    node = container.childNodes[offset] || container;
                    if (dom.isText(node)) {
                        return textRangeInfo(node, 0);
                    }

                    offset = 0;
                    isCollapseToStart = false;
                }

                return {
                    node: node,
                    collapseToStart: isCollapseToStart,
                    offset: offset
                };
            };

            var textRange = document.body.createTextRange();
            var info = textRangeInfo(point.node, point.offset);

            textRange.moveToElementText(info.node);
            textRange.collapse(info.collapseToStart);
            textRange.moveStart('character', info.offset);
            return textRange;
        };

        /**
        * Wrapped Range
        *
        * @constructor
        * @param {Node} sc - start container
        * @param {Number} so - start offset
        * @param {Node} ec - end container
        * @param {Number} eo - end offset
        */
        var WrappedRange = function (sc, so, ec, eo) {
            this.sc = sc;
            this.so = so;
            this.ec = ec;
            this.eo = eo;

            // nativeRange: get nativeRange from sc, so, ec, eo
            var nativeRange = function () {
                if (agent.isW3CRangeSupport) {
                    var w3cRange = document.createRange();
                    w3cRange.setStart(sc, so);
                    w3cRange.setEnd(ec, eo);

                    return w3cRange;
                } else {
                    var textRange = pointToTextRange({
                        node: sc,
                        offset: so
                    });

                    textRange.setEndPoint('EndToEnd', pointToTextRange({
                        node: ec,
                        offset: eo
                    }));

                    return textRange;
                }
            };

            this.getPoints = function () {
                return {
                    sc: sc,
                    so: so,
                    ec: ec,
                    eo: eo
                };
            };

            this.getStartPoint = function () {
                return {
                    node: sc,
                    offset: so
                };
            };

            this.getEndPoint = function () {
                return {
                    node: ec,
                    offset: eo
                };
            };

            /**
            * select update visible range
            */
            this.select = function () {
                var nativeRng = nativeRange();
                if (agent.isW3CRangeSupport) {
                    var selection = document.getSelection();
                    if (selection.rangeCount > 0) {
                        selection.removeAllRanges();
                    }
                    selection.addRange(nativeRng);
                } else {
                    nativeRng.select();
                }

                return this;
            };

            /**
            * Moves the scrollbar to start container(sc) of current range
            *
            * @return {WrappedRange}
            */
            this.scrollIntoView = function (container) {
                var height = $(container).height();
                if (container.scrollTop + height < this.sc.offsetTop) {
                    container.scrollTop += Math.abs(container.scrollTop + height - this.sc.offsetTop);
                }

                return this;
            };

            /**
            * @return {WrappedRange}
            */
            this.normalize = function () {

                /**
                * @param {BoundaryPoint} point
                * @param {Boolean} isLeftToRight
                * @return {BoundaryPoint}
                */
                var getVisiblePoint = function (point, isLeftToRight) {
                    if ((dom.isVisiblePoint(point) && !dom.isEdgePoint(point)) ||
                    (dom.isVisiblePoint(point) && dom.isRightEdgePoint(point) && !isLeftToRight) ||
                    (dom.isVisiblePoint(point) && dom.isLeftEdgePoint(point) && isLeftToRight) ||
                    (dom.isVisiblePoint(point) && dom.isBlock(point.node) && dom.isEmpty(point.node))) {
                        return point;
                    }

                    // point on block's edge
                    var block = dom.ancestor(point.node, dom.isBlock);
                    if (((dom.isLeftEdgePointOf(point, block) || dom.isVoid(dom.prevPoint(point).node)) && !isLeftToRight) ||
                    ((dom.isRightEdgePointOf(point, block) || dom.isVoid(dom.nextPoint(point).node)) && isLeftToRight)) {

                        // returns point already on visible point
                        if (dom.isVisiblePoint(point)) {
                            return point;
                        }
                        // reverse direction
                        isLeftToRight = !isLeftToRight;
                    }

                    var nextPoint = isLeftToRight ? dom.nextPointUntil(dom.nextPoint(point), dom.isVisiblePoint) :
                    dom.prevPointUntil(dom.prevPoint(point), dom.isVisiblePoint);
                    return nextPoint || point;
                };

                var endPoint = getVisiblePoint(this.getEndPoint(), false);
                var startPoint = this.isCollapsed() ? endPoint : getVisiblePoint(this.getStartPoint(), true);

                return new WrappedRange(
                    startPoint.node,
                    startPoint.offset,
                    endPoint.node,
                    endPoint.offset
                );
            };

            /**
            * returns matched nodes on range
            *
            * @param {Function} [pred] - predicate function
            * @param {Object} [options]
            * @param {Boolean} [options.includeAncestor]
            * @param {Boolean} [options.fullyContains]
            * @return {Node[]}
            */
            this.nodes = function (pred, options) {
                pred = pred || func.ok;

                var includeAncestor = options && options.includeAncestor;
                var fullyContains = options && options.fullyContains;

                // TODO compare points and sort
                var startPoint = this.getStartPoint();
                var endPoint = this.getEndPoint();

                var nodes = [];
                var leftEdgeNodes = [];

                dom.walkPoint(startPoint, endPoint, function (point) {
                    if (dom.isEditable(point.node)) {
                        return;
                    }

                    var node;
                    if (fullyContains) {
                        if (dom.isLeftEdgePoint(point)) {
                            leftEdgeNodes.push(point.node);
                        }
                        if (dom.isRightEdgePoint(point) && list.contains(leftEdgeNodes, point.node)) {
                            node = point.node;
                        }
                    } else if (includeAncestor) {
                        node = dom.ancestor(point.node, pred);
                    } else {
                        node = point.node;
                    }

                    if (node && pred(node)) {
                        nodes.push(node);
                    }
                }, true);

                return list.unique(nodes);
            };

            /**
            * returns commonAncestor of range
            * @return {Element} - commonAncestor
            */
            this.commonAncestor = function () {
                return dom.commonAncestor(sc, ec);
            };

            /**
            * returns expanded range by pred
            *
            * @param {Function} pred - predicate function
            * @return {WrappedRange}
            */
            this.expand = function (pred) {
                var startAncestor = dom.ancestor(sc, pred);
                var endAncestor = dom.ancestor(ec, pred);

                if (!startAncestor && !endAncestor) {
                    return new WrappedRange(sc, so, ec, eo);
                }

                var boundaryPoints = this.getPoints();

                if (startAncestor) {
                    boundaryPoints.sc = startAncestor;
                    boundaryPoints.so = 0;
                }

                if (endAncestor) {
                    boundaryPoints.ec = endAncestor;
                    boundaryPoints.eo = dom.nodeLength(endAncestor);
                }

                return new WrappedRange(
                    boundaryPoints.sc,
                    boundaryPoints.so,
                    boundaryPoints.ec,
                    boundaryPoints.eo
                );
            };

            /**
            * @param {Boolean} isCollapseToStart
            * @return {WrappedRange}
            */
            this.collapse = function (isCollapseToStart) {
                if (isCollapseToStart) {
                    return new WrappedRange(sc, so, sc, so);
                } else {
                    return new WrappedRange(ec, eo, ec, eo);
                }
            };

            /**
            * splitText on range
            */
            this.splitText = function () {
                var isSameContainer = sc === ec;
                var boundaryPoints = this.getPoints();

                if (dom.isText(ec) && !dom.isEdgePoint(this.getEndPoint())) {
                    ec.splitText(eo);
                }

                if (dom.isText(sc) && !dom.isEdgePoint(this.getStartPoint())) {
                    boundaryPoints.sc = sc.splitText(so);
                    boundaryPoints.so = 0;

                    if (isSameContainer) {
                        boundaryPoints.ec = boundaryPoints.sc;
                        boundaryPoints.eo = eo - so;
                    }
                }

                return new WrappedRange(
                    boundaryPoints.sc,
                    boundaryPoints.so,
                    boundaryPoints.ec,
                    boundaryPoints.eo
                );
            };

            /**
            * delete contents on range
            * @return {WrappedRange}
            */
            this.deleteContents = function () {
                if (this.isCollapsed()) {
                    return this;
                }

                var rng = this.splitText();
                var nodes = rng.nodes(null, {
                    fullyContains: true
                });

                // find new cursor point
                var point = dom.prevPointUntil(rng.getStartPoint(), function (point) {
                    return !list.contains(nodes, point.node);
                });

                var emptyParents = [];
                $.each(nodes, function (idx, node) {
                    // find empty parents
                    var parent = node.parentNode;
                    if (point.node !== parent && dom.nodeLength(parent) === 1) {
                        emptyParents.push(parent);
                    }
                    dom.remove(node, false);
                });

                // remove empty parents
                $.each(emptyParents, function (idx, node) {
                    dom.remove(node, false);
                });

                return new WrappedRange(
                    point.node,
                    point.offset,
                    point.node,
                    point.offset
                ).normalize();
            };

            /**
            * makeIsOn: return isOn(pred) function
            */
            var makeIsOn = function (pred) {
                return function () {
                    var ancestor = dom.ancestor(sc, pred);
                    return !!ancestor && (ancestor === dom.ancestor(ec, pred));
                };
            };

            // isOnEditable: judge whether range is on editable or not
            this.isOnEditable = makeIsOn(dom.isEditable);
            // isOnList: judge whether range is on list node or not
            this.isOnList = makeIsOn(dom.isList);
            // isOnAnchor: judge whether range is on anchor node or not
            this.isOnAnchor = makeIsOn(dom.isAnchor);
            // isOnCell: judge whether range is on cell node or not
            this.isOnCell = makeIsOn(dom.isCell);
            // isOnData: judge whether range is on data node or not
            this.isOnData = makeIsOn(dom.isData);

            /**
            * @param {Function} pred
            * @return {Boolean}
            */
            this.isLeftEdgeOf = function (pred) {
                if (!dom.isLeftEdgePoint(this.getStartPoint())) {
                    return false;
                }

                var node = dom.ancestor(this.sc, pred);
                return node && dom.isLeftEdgeOf(this.sc, node);
            };

            /**
            * returns whether range was collapsed or not
            */
            this.isCollapsed = function () {
                return sc === ec && so === eo;
            };

            /**
            * wrap inline nodes which children of body with paragraph
            *
            * @return {WrappedRange}
            */
            this.wrapBodyInlineWithPara = function () {
                if (dom.isBodyContainer(sc) && dom.isEmpty(sc)) {
                    sc.innerHTML = dom.emptyPara;
                    return new WrappedRange(sc.firstChild, 0, sc.firstChild, 0);
                }

                /**
                * [workaround] firefox often create range on not visible point. so normalize here.
                *  - firefox: |<p>text</p>|
                *  - chrome: <p>|text|</p>
                */
                var rng = this.normalize();
                if (dom.isParaInline(sc) || dom.isPara(sc)) {
                    return rng;
                }

                // find inline top ancestor
                var topAncestor;
                if (dom.isInline(rng.sc)) {
                    var ancestors = dom.listAncestor(rng.sc, func.not(dom.isInline));
                    topAncestor = list.last(ancestors);
                    if (!dom.isInline(topAncestor)) {
                        topAncestor = ancestors[ancestors.length - 2] || rng.sc.childNodes[rng.so];
                    }
                } else {
                    topAncestor = rng.sc.childNodes[rng.so > 0 ? rng.so - 1 : 0];
                }

                // siblings not in paragraph
                var inlineSiblings = dom.listPrev(topAncestor, dom.isParaInline).reverse();
                inlineSiblings = inlineSiblings.concat(dom.listNext(topAncestor.nextSibling, dom.isParaInline));

                // wrap with paragraph
                if (inlineSiblings.length) {
                    var para = dom.wrap(list.head(inlineSiblings), 'p');
                    dom.appendChildNodes(para, list.tail(inlineSiblings));
                }

                return this.normalize();
            };

            /**
            * insert node at current cursor
            *
            * @param {Node} node
            * @return {Node}
            */
            this.insertNode = function (node) {
                var rng = this.wrapBodyInlineWithPara().deleteContents();
                var info = dom.splitPoint(rng.getStartPoint(), dom.isInline(node));

                if (info.rightNode) {
                    info.rightNode.parentNode.insertBefore(node, info.rightNode);
                } else {
                    info.container.appendChild(node);
                }

                return node;
            };

            /**
            * insert html at current cursor
            */
            this.pasteHTML = function (markup) {
                var contentsContainer = $('<div></div>').html(markup)[0];
                var childNodes = list.from(contentsContainer.childNodes);

                var rng = this.wrapBodyInlineWithPara().deleteContents();

                return childNodes.reverse().map(function (childNode) {
                    return rng.insertNode(childNode);
                }).reverse();
            };

            /**
            * returns text in range
            *
            * @return {String}
            */
            this.toString = function () {
                var nativeRng = nativeRange();
                return agent.isW3CRangeSupport ? nativeRng.toString() : nativeRng.text;
            };

            /**
            * returns range for word before cursor
            *
            * @param {Boolean} [findAfter] - find after cursor, default: false
            * @return {WrappedRange}
            */
            this.getWordRange = function (findAfter) {
                var endPoint = this.getEndPoint();

                if (!dom.isCharPoint(endPoint)) {
                    return this;
                }

                var startPoint = dom.prevPointUntil(endPoint, function (point) {
                    return !dom.isCharPoint(point);
                });

                if (findAfter) {
                    endPoint = dom.nextPointUntil(endPoint, function (point) {
                        return !dom.isCharPoint(point);
                    });
                }

                return new WrappedRange(
                    startPoint.node,
                    startPoint.offset,
                    endPoint.node,
                    endPoint.offset
                );
            };

            /**
            * create offsetPath bookmark
            *
            * @param {Node} editable
            */
            this.bookmark = function (editable) {
                return {
                    s: {
                        path: dom.makeOffsetPath(editable, sc),
                        offset: so
                    },
                    e: {
                        path: dom.makeOffsetPath(editable, ec),
                        offset: eo
                    }
                };
            };

            /**
            * create offsetPath bookmark base on paragraph
            *
            * @param {Node[]} paras
            */
            this.paraBookmark = function (paras) {
                return {
                    s: {
                        path: list.tail(dom.makeOffsetPath(list.head(paras), sc)),
                        offset: so
                    },
                    e: {
                        path: list.tail(dom.makeOffsetPath(list.last(paras), ec)),
                        offset: eo
                    }
                };
            };

            /**
            * getClientRects
            * @return {Rect[]}
            */
            this.getClientRects = function () {
                var nativeRng = nativeRange();
                return nativeRng.getClientRects();
            };
        };

        /**
        * @class core.range
        *
        * Data structure
        *  * BoundaryPoint: a point of dom tree
        *  * BoundaryPoints: two boundaryPoints corresponding to the start and the end of the Range
        *
        * See to http://www.w3.org/TR/DOM-Level-2-Traversal-Range/ranges.html#Level-2-Range-Position
        *
        * @singleton
        * @alternateClassName range
        */
        return {
            /**
            * create Range Object From arguments or Browser Selection
            *
            * @param {Node} sc - start container
            * @param {Number} so - start offset
            * @param {Node} ec - end container
            * @param {Number} eo - end offset
            * @return {WrappedRange}
            */
            create: function (sc, so, ec, eo) {
                if (arguments.length === 4) {
                    return new WrappedRange(sc, so, ec, eo);
                } else if (arguments.length === 2) { //collapsed
                    ec = sc;
                    eo = so;
                    return new WrappedRange(sc, so, ec, eo);
                } else {
                    var wrappedRange = this.createFromSelection();
                    if (!wrappedRange && arguments.length === 1) {
                        wrappedRange = this.createFromNode(arguments[0]);
                        return wrappedRange.collapse(dom.emptyPara === arguments[0].innerHTML);
                    }
                    return wrappedRange;
                }
            },

            createFromSelection: function () {
                var sc, so, ec, eo;
                if (agent.isW3CRangeSupport) {
                    var selection = document.getSelection();
                    if (!selection || selection.rangeCount === 0) {
                        return null;
                    } else if (dom.isBody(selection.anchorNode)) {
                        // Firefox: returns entire body as range on initialization.
                        // We won't never need it.
                        return null;
                    }

                    var nativeRng = selection.getRangeAt(0);
                    sc = nativeRng.startContainer;
                    so = nativeRng.startOffset;
                    ec = nativeRng.endContainer;
                    eo = nativeRng.endOffset;
                } else { // IE8: TextRange
                    var textRange = document.selection.createRange();
                    var textRangeEnd = textRange.duplicate();
                    textRangeEnd.collapse(false);
                    var textRangeStart = textRange;
                    textRangeStart.collapse(true);

                    var startPoint = textRangeToPoint(textRangeStart, true),
                    endPoint = textRangeToPoint(textRangeEnd, false);

                    // same visible point case: range was collapsed.
                    if (dom.isText(startPoint.node) && dom.isLeftEdgePoint(startPoint) &&
                    dom.isTextNode(endPoint.node) && dom.isRightEdgePoint(endPoint) &&
                    endPoint.node.nextSibling === startPoint.node) {
                        startPoint = endPoint;
                    }

                    sc = startPoint.cont;
                    so = startPoint.offset;
                    ec = endPoint.cont;
                    eo = endPoint.offset;
                }

                return new WrappedRange(sc, so, ec, eo);
            },

            /**
            * @method
            *
            * create WrappedRange from node
            *
            * @param {Node} node
            * @return {WrappedRange}
            */
            createFromNode: function (node) {
                var sc = node;
                var so = 0;
                var ec = node;
                var eo = dom.nodeLength(ec);

                // browsers can't target a picture or void node
                if (dom.isVoid(sc)) {
                    so = dom.listPrev(sc).length - 1;
                    sc = sc.parentNode;
                }
                if (dom.isBR(ec)) {
                    eo = dom.listPrev(ec).length - 1;
                    ec = ec.parentNode;
                } else if (dom.isVoid(ec)) {
                    eo = dom.listPrev(ec).length;
                    ec = ec.parentNode;
                }

                return this.create(sc, so, ec, eo);
            },

            /**
            * create WrappedRange from node after position
            *
            * @param {Node} node
            * @return {WrappedRange}
            */
            createFromNodeBefore: function (node) {
                return this.createFromNode(node).collapse(true);
            },

            /**
            * create WrappedRange from node after position
            *
            * @param {Node} node
            * @return {WrappedRange}
            */
            createFromNodeAfter: function (node) {
                return this.createFromNode(node).collapse();
            },

            /**
            * @method
            *
            * create WrappedRange from bookmark
            *
            * @param {Node} editable
            * @param {Object} bookmark
            * @return {WrappedRange}
            */
            createFromBookmark: function (editable, bookmark) {
                var sc = dom.fromOffsetPath(editable, bookmark.s.path);
                var so = bookmark.s.offset;
                var ec = dom.fromOffsetPath(editable, bookmark.e.path);
                var eo = bookmark.e.offset;
                return new WrappedRange(sc, so, ec, eo);
            },

            /**
            * @method
            *
            * create WrappedRange from paraBookmark
            *
            * @param {Object} bookmark
            * @param {Node[]} paras
            * @return {WrappedRange}
            */
            createFromParaBookmark: function (bookmark, paras) {
                var so = bookmark.s.offset;
                var eo = bookmark.e.offset;
                var sc = dom.fromOffsetPath(list.head(paras), bookmark.s.path);
                var ec = dom.fromOffsetPath(list.last(paras), bookmark.e.path);

                return new WrappedRange(sc, so, ec, eo);
            }
        };
    })();

  /**
   * @class core.async
   *
   * Async functions which returns `Promise`
   *
   * @singleton
   * @alternateClassName async
   */
  var async = (function () {
    /**
     * @method readFileAsDataURL
     *
     * read contents of file as representing URL
     *
     * @param {File} file
     * @return {Promise} - then: dataUrl
     */
    var readFileAsDataURL = function (file) {
      return $.Deferred(function (deferred) {
        $.extend(new FileReader(), {
          onload: function (e) {
            var dataURL = e.target.result;
            deferred.resolve(dataURL);
          },
          onerror: function () {
            deferred.reject(this);
          }
        }).readAsDataURL(file);
      }).promise();
    };
  
    /**
     * @method createImage
     *
     * create `<image>` from url string
     *
     * @param {String} url
     * @return {Promise} - then: $image
     */
    var createImage = function (url) {
      return $.Deferred(function (deferred) {
        var $img = $('<img>');

        $img.one('load', function () {
          $img.off('error abort');
          deferred.resolve($img);
        }).one('error abort', function () {
          $img.off('load').detach();
          deferred.reject($img);
        }).css({
          display: 'none'
        }).appendTo(document.body).attr('src', url);
      }).promise();
    };

    return {
      readFileAsDataURL: readFileAsDataURL,
      createImage: createImage
    };
  })();

  /**
   * @class editing.History
   *
   * Editor History
   *
   */
  var History = function ($editable) {
    var stack = [], stackOffset = -1;
    var editable = $editable[0];

    var makeSnapshot = function () {
      var rng = range.create(editable);
      var emptyBookmark = {s: {path: [], offset: 0}, e: {path: [], offset: 0}};

      return {
        contents: $editable.html(),
        bookmark: (rng ? rng.bookmark(editable) : emptyBookmark)
      };
    };

    var applySnapshot = function (snapshot) {
      if (snapshot.contents !== null) {
        $editable.html(snapshot.contents);
      }
      if (snapshot.bookmark !== null) {
        range.createFromBookmark(editable, snapshot.bookmark).select();
      }
    };

    /**
    * @method rewind
    * Rewinds the history stack back to the first snapshot taken.
    * Leaves the stack intact, so that "Redo" can still be used.
    */
    this.rewind = function () {
      // Create snap shot if not yet recorded
      if ($editable.html() !== stack[stackOffset].contents) {
        this.recordUndo();
      }

      // Return to the first available snapshot.
      stackOffset = 0;

      // Apply that snapshot.
      applySnapshot(stack[stackOffset]);
    };

    /**
    * @method reset
    * Resets the history stack completely; reverting to an empty editor.
    */
    this.reset = function () {
      // Clear the stack.
      stack = [];

      // Restore stackOffset to its original value.
      stackOffset = -1;

      // Clear the editable area.
      $editable.html('');

      // Record our first snapshot (of nothing).
      this.recordUndo();
    };

    /**
     * undo
     */
    this.undo = function () {
      // Create snap shot if not yet recorded
      if ($editable.html() !== stack[stackOffset].contents) {
        this.recordUndo();
      }

      if (0 < stackOffset) {
        stackOffset--;
        applySnapshot(stack[stackOffset]);
      }
    };

    /**
     * redo
     */
    this.redo = function () {
      if (stack.length - 1 > stackOffset) {
        stackOffset++;
        applySnapshot(stack[stackOffset]);
      }
    };

    /**
     * recorded undo
     */
    this.recordUndo = function () {
      stackOffset++;

      // Wash out stack after stackOffset
      if (stack.length > stackOffset) {
        stack = stack.slice(0, stackOffset);
      }

      // Create new snapshot and push it to the end
      stack.push(makeSnapshot());
    };
  };

  /**
   * @class editing.Style
   *
   * Style
   *
   */
  var Style = function () {
    /**
     * @method jQueryCSS
     *
     * [workaround] for old jQuery
     * passing an array of style properties to .css()
     * will result in an object of property-value pairs.
     * (compability with version < 1.9)
     *
     * @private
     * @param  {jQuery} $obj
     * @param  {Array} propertyNames - An array of one or more CSS properties.
     * @return {Object}
     */
    var jQueryCSS = function ($obj, propertyNames) {
      if (agent.jqueryVersion < 1.9) {
        var result = {};
        $.each(propertyNames, function (idx, propertyName) {
          result[propertyName] = $obj.css(propertyName);
        });
        return result;
      }
      return $obj.css.call($obj, propertyNames);
    };

    /**
     * returns style object from node
     *
     * @param {jQuery} $node
     * @return {Object}
     */
    this.fromNode = function ($node) {
      var properties = ['font-family', 'font-size', 'text-align', 'list-style-type', 'line-height'];
      var styleInfo = jQueryCSS($node, properties) || {};
      styleInfo['font-size'] = parseInt(styleInfo['font-size'], 10);
      return styleInfo;
    };

    /**
     * paragraph level style
     *
     * @param {WrappedRange} rng
     * @param {Object} styleInfo
     */
    this.stylePara = function (rng, styleInfo) {
      $.each(rng.nodes(dom.isPara, {
        includeAncestor: true
      }), function (idx, para) {
        $(para).css(styleInfo);
      });
    };

    /**
     * insert and returns styleNodes on range.
     *
     * @param {WrappedRange} rng
     * @param {Object} [options] - options for styleNodes
     * @param {String} [options.nodeName] - default: `SPAN`
     * @param {Boolean} [options.expandClosestSibling] - default: `false`
     * @param {Boolean} [options.onlyPartialContains] - default: `false`
     * @return {Node[]}
     */
    this.styleNodes = function (rng, options) {
      rng = rng.splitText();

      var nodeName = options && options.nodeName || 'SPAN';
      var expandClosestSibling = !!(options && options.expandClosestSibling);
      var onlyPartialContains = !!(options && options.onlyPartialContains);

      if (rng.isCollapsed()) {
        return [rng.insertNode(dom.create(nodeName))];
      }

      var pred = dom.makePredByNodeName(nodeName);
      var nodes = rng.nodes(dom.isText, {
        fullyContains: true
      }).map(function (text) {
        return dom.singleChildAncestor(text, pred) || dom.wrap(text, nodeName);
      });

      if (expandClosestSibling) {
        if (onlyPartialContains) {
          var nodesInRange = rng.nodes();
          // compose with partial contains predication
          pred = func.and(pred, function (node) {
            return list.contains(nodesInRange, node);
          });
        }

        return nodes.map(function (node) {
          var siblings = dom.withClosestSiblings(node, pred);
          var head = list.head(siblings);
          var tails = list.tail(siblings);
          $.each(tails, function (idx, elem) {
            dom.appendChildNodes(head, elem.childNodes);
            dom.remove(elem);
          });
          return list.head(siblings);
        });
      } else {
        return nodes;
      }
    };

    /**
     * get current style on cursor
     *
     * @param {WrappedRange} rng
     * @return {Object} - object contains style properties.
     */
    this.current = function (rng) {
      var $cont = $(!dom.isElement(rng.sc) ? rng.sc.parentNode : rng.sc);
      var styleInfo = this.fromNode($cont);

      // document.queryCommandState for toggle state
      // [workaround] prevent Firefox nsresult: "0x80004005 (NS_ERROR_FAILURE)"
      try {
        styleInfo = $.extend(styleInfo, {
          'font-bold': document.queryCommandState('bold') ? 'bold' : 'normal',
          'font-italic': document.queryCommandState('italic') ? 'italic' : 'normal',
          'font-underline': document.queryCommandState('underline') ? 'underline' : 'normal',
          'font-subscript': document.queryCommandState('subscript') ? 'subscript' : 'normal',
          'font-superscript': document.queryCommandState('superscript') ? 'superscript' : 'normal',
          'font-strikethrough': document.queryCommandState('strikethrough') ? 'strikethrough' : 'normal',
          'font-family': document.queryCommandValue('fontname') || styleInfo['font-family']
        });
      } catch (e) {}

      // list-style-type to list-style(unordered, ordered)
      if (!rng.isOnList()) {
        styleInfo['list-style'] = 'none';
      } else {
        var orderedTypes = ['circle', 'disc', 'disc-leading-zero', 'square'];
        var isUnordered = $.inArray(styleInfo['list-style-type'], orderedTypes) > -1;
        styleInfo['list-style'] = isUnordered ? 'unordered' : 'ordered';
      }

      var para = dom.ancestor(rng.sc, dom.isPara);
      if (para && para.style['line-height']) {
        styleInfo['line-height'] = para.style.lineHeight;
      } else {
        var lineHeight = parseInt(styleInfo['line-height'], 10) / parseInt(styleInfo['font-size'], 10);
        styleInfo['line-height'] = lineHeight.toFixed(1);
      }

      styleInfo.anchor = rng.isOnAnchor() && dom.ancestor(rng.sc, dom.isAnchor);
      styleInfo.ancestors = dom.listAncestor(rng.sc, dom.isEditable);
      styleInfo.range = rng;

      return styleInfo;
    };
  };


  /**
   * @class editing.Bullet
   *
   * @alternateClassName Bullet
   */
  var Bullet = function () {
    var self = this;

    /**
     * toggle ordered list
     */
    this.insertOrderedList = function (editable) {
      this.toggleList('OL', editable);
    };

    /**
     * toggle unordered list
     */
    this.insertUnorderedList = function (editable) {
      this.toggleList('UL', editable);
    };

    /**
     * indent
     */
    this.indent = function (editable) {
      var self = this;
      var rng = range.create(editable).wrapBodyInlineWithPara();

      var paras = rng.nodes(dom.isPara, { includeAncestor: true });
      var clustereds = list.clusterBy(paras, func.peq2('parentNode'));

      $.each(clustereds, function (idx, paras) {
        var head = list.head(paras);
        if (dom.isLi(head)) {
          self.wrapList(paras, head.parentNode.nodeName);
        } else {
          $.each(paras, function (idx, para) {
            $(para).css('marginLeft', function (idx, val) {
              return (parseInt(val, 10) || 0) + 25;
            });
          });
        }
      });

      rng.select();
    };

    /**
     * outdent
     */
    this.outdent = function (editable) {
      var self = this;
      var rng = range.create(editable).wrapBodyInlineWithPara();

      var paras = rng.nodes(dom.isPara, { includeAncestor: true });
      var clustereds = list.clusterBy(paras, func.peq2('parentNode'));

      $.each(clustereds, function (idx, paras) {
        var head = list.head(paras);
        if (dom.isLi(head)) {
          self.releaseList([paras]);
        } else {
          $.each(paras, function (idx, para) {
            $(para).css('marginLeft', function (idx, val) {
              val = (parseInt(val, 10) || 0);
              return val > 25 ? val - 25 : '';
            });
          });
        }
      });

      rng.select();
    };

    /**
     * toggle list
     *
     * @param {String} listName - OL or UL
     */
    this.toggleList = function (listName, editable) {
      var rng = range.create(editable).wrapBodyInlineWithPara();

      var paras = rng.nodes(dom.isPara, { includeAncestor: true });
      var bookmark = rng.paraBookmark(paras);
      var clustereds = list.clusterBy(paras, func.peq2('parentNode'));

      // paragraph to list
      if (list.find(paras, dom.isPurePara)) {
        var wrappedParas = [];
        $.each(clustereds, function (idx, paras) {
          wrappedParas = wrappedParas.concat(self.wrapList(paras, listName));
        });
        paras = wrappedParas;
      // list to paragraph or change list style
      } else {
        var diffLists = rng.nodes(dom.isList, {
          includeAncestor: true
        }).filter(function (listNode) {
          return !$.nodeName(listNode, listName);
        });

        if (diffLists.length) {
          $.each(diffLists, function (idx, listNode) {
            dom.replace(listNode, listName);
          });
        } else {
          paras = this.releaseList(clustereds, true);
        }
      }

      range.createFromParaBookmark(bookmark, paras).select();
    };

    /**
     * @param {Node[]} paras
     * @param {String} listName
     * @return {Node[]}
     */
    this.wrapList = function (paras, listName) {
      var head = list.head(paras);
      var last = list.last(paras);

      var prevList = dom.isList(head.previousSibling) && head.previousSibling;
      var nextList = dom.isList(last.nextSibling) && last.nextSibling;

      var listNode = prevList || dom.insertAfter(dom.create(listName || 'UL'), last);

      // P to LI
      paras = paras.map(function (para) {
        return dom.isPurePara(para) ? dom.replace(para, 'LI') : para;
      });

      // append to list(<ul>, <ol>)
      dom.appendChildNodes(listNode, paras);

      if (nextList) {
        dom.appendChildNodes(listNode, list.from(nextList.childNodes));
        dom.remove(nextList);
      }

      return paras;
    };

    /**
     * @method releaseList
     *
     * @param {Array[]} clustereds
     * @param {Boolean} isEscapseToBody
     * @return {Node[]}
     */
    this.releaseList = function (clustereds, isEscapseToBody) {
      var releasedParas = [];

      $.each(clustereds, function (idx, paras) {
        var head = list.head(paras);
        var last = list.last(paras);

        var headList = isEscapseToBody ? dom.lastAncestor(head, dom.isList) :
                                         head.parentNode;
        var lastList = headList.childNodes.length > 1 ? dom.splitTree(headList, {
          node: last.parentNode,
          offset: dom.position(last) + 1
        }, {
          isSkipPaddingBlankHTML: true
        }) : null;

        var middleList = dom.splitTree(headList, {
          node: head.parentNode,
          offset: dom.position(head)
        }, {
          isSkipPaddingBlankHTML: true
        });

        paras = isEscapseToBody ? dom.listDescendant(middleList, dom.isLi) :
                                  list.from(middleList.childNodes).filter(dom.isLi);

        // LI to P
        if (isEscapseToBody || !dom.isList(headList.parentNode)) {
          paras = paras.map(function (para) {
            return dom.replace(para, 'P');
          });
        }

        $.each(list.from(paras).reverse(), function (idx, para) {
          dom.insertAfter(para, headList);
        });

        // remove empty lists
        var rootLists = list.compact([headList, middleList, lastList]);
        $.each(rootLists, function (idx, rootList) {
          var listNodes = [rootList].concat(dom.listDescendant(rootList, dom.isList));
          $.each(listNodes.reverse(), function (idx, listNode) {
            if (!dom.nodeLength(listNode)) {
              dom.remove(listNode, true);
            }
          });
        });

        releasedParas = releasedParas.concat(paras);
      });

      return releasedParas;
    };
  };


  /**
   * @class editing.Typing
   *
   * Typing
   *
   */
  var Typing = function () {

    // a Bullet instance to toggle lists off
    var bullet = new Bullet();

    /**
     * insert tab
     *
     * @param {WrappedRange} rng
     * @param {Number} tabsize
     */
    this.insertTab = function (rng, tabsize) {
      var tab = dom.createText(new Array(tabsize + 1).join(dom.NBSP_CHAR));
      rng = rng.deleteContents();
      rng.insertNode(tab, true);

      rng = range.create(tab, tabsize);
      rng.select();
    };

    /**
     * insert paragraph
     */
    this.insertParagraph = function (editable) {
      var rng = range.create(editable);

      // deleteContents on range.
      rng = rng.deleteContents();

      // Wrap range if it needs to be wrapped by paragraph
      rng = rng.wrapBodyInlineWithPara();

      // finding paragraph
      var splitRoot = dom.ancestor(rng.sc, dom.isPara);

      var nextPara;
      // on paragraph: split paragraph
      if (splitRoot) {
        // if it is an empty line with li
        if (dom.isEmpty(splitRoot) && dom.isLi(splitRoot)) {
          // toogle UL/OL and escape
          bullet.toggleList(splitRoot.parentNode.nodeName);
          return;
        // if it is an empty line with para on blockquote
        } else if (dom.isEmpty(splitRoot) && dom.isPara(splitRoot) && dom.isBlockquote(splitRoot.parentNode)) {
          // escape blockquote
          dom.insertAfter(splitRoot, splitRoot.parentNode);
          nextPara = splitRoot;
        // if new line has content (not a line break)
        } else {
          nextPara = dom.splitTree(splitRoot, rng.getStartPoint());

          var emptyAnchors = dom.listDescendant(splitRoot, dom.isEmptyAnchor);
          emptyAnchors = emptyAnchors.concat(dom.listDescendant(nextPara, dom.isEmptyAnchor));

          $.each(emptyAnchors, function (idx, anchor) {
            dom.remove(anchor);
          });

          // replace empty heading, pre or custom-made styleTag with P tag
          if ((dom.isHeading(nextPara) || dom.isPre(nextPara) || dom.isCustomStyleTag(nextPara)) && dom.isEmpty(nextPara)) {
            nextPara = dom.replace(nextPara, 'p');
          }
        }
      // no paragraph: insert empty paragraph
      } else {
        var next = rng.sc.childNodes[rng.so];
        nextPara = $(dom.emptyPara)[0];
        if (next) {
          rng.sc.insertBefore(nextPara, next);
        } else {
          rng.sc.appendChild(nextPara);
        }
      }

      range.create(nextPara, 0).normalize().select().scrollIntoView(editable);
    };
  };


    /**
    * @class Create a virtual table to create what actions to do in change.
    * @param {object} startPoint Cell selected to apply change.
    * @param {enum} where  Where change will be applied Row or Col. Use enum: TableResultAction.where
    * @param {enum} action Action to be applied. Use enum: TableResultAction.requestAction
    * @param {object} domTable Dom element of table to make changes.
    */
    var TableResultAction = function (startPoint, where, action, domTable) {
        var _startPoint = { 'colPos': 0, 'rowPos': 0 };
        var _virtualTable = [];
        var _actionCellList = [];

        //////////////////////////////////////////////
        // Private functions
        //////////////////////////////////////////////

        /**
        * Set the startPoint of action.
        */
        function setStartPoint() {
            if (!startPoint || !startPoint.tagName || (startPoint.tagName.toLowerCase() !== 'td' && startPoint.tagName.toLowerCase() !== 'th')) {
                console.error('Impossible to identify start Cell point.', startPoint);
                return;
            }
            _startPoint.colPos = startPoint.cellIndex;
            if (!startPoint.parentElement || !startPoint.parentElement.tagName || startPoint.parentElement.tagName.toLowerCase() !== 'tr') {
                console.error('Impossible to identify start Row point.', startPoint);
                return;
            }
            _startPoint.rowPos = startPoint.parentElement.rowIndex;
        }

        /**
        * Define virtual table position info object.
        *
        * @param {int} rowIndex Index position in line of virtual table.
        * @param {int} cellIndex Index position in column of virtual table.
        * @param {object} baseRow Row affected by this position.
        * @param {object} baseCell Cell affected by this position.
        * @param {bool} isSpan Inform if it is an span cell/row.
        */
        function setVirtualTablePosition(rowIndex, cellIndex, baseRow, baseCell, isRowSpan, isColSpan, isVirtualCell) {
            var objPosition = {
                'baseRow': baseRow,
                'baseCell': baseCell,
                'isRowSpan': isRowSpan,
                'isColSpan': isColSpan,
                'isVirtual': isVirtualCell
            };
            if (!_virtualTable[rowIndex]) {
                _virtualTable[rowIndex] = [];
            }
            _virtualTable[rowIndex][cellIndex] = objPosition;
        }

        /**
        * Create action cell object.
        *
        * @param {object} virtualTableCellObj Object of specific position on virtual table.
        * @param {enum} resultAction Action to be applied in that item.
        */
        function getActionCell(virtualTableCellObj, resultAction, virtualRowPosition, virtualColPosition) {
            return {
                'baseCell': virtualTableCellObj.baseCell,
                'action': resultAction,
                'virtualTable': {
                    'rowIndex': virtualRowPosition,
                    'cellIndex': virtualColPosition
                }
            };
        }

        /**
        * Recover free index of row to append Cell.
        *
        * @param {int} rowIndex Index of row to find free space.
        * @param {int} cellIndex Index of cell to find free space in table.
        */
        function recoverCellIndex(rowIndex, cellIndex) {
            if (!_virtualTable[rowIndex]) {
                return cellIndex;
            }
            if (!_virtualTable[rowIndex][cellIndex]) {
                return cellIndex;
            }

            var newCellIndex = cellIndex;
            while (_virtualTable[rowIndex][newCellIndex]) {
                newCellIndex++;
                if (!_virtualTable[rowIndex][newCellIndex]) {
                    return newCellIndex;
                }
            }
        }

        /**
        * Recover info about row and cell and add information to virtual table.
        *
        * @param {object} row Row to recover information.
        * @param {object} cell Cell to recover information.
        */
        function addCellInfoToVirtual(row, cell) {
            var cellIndex = recoverCellIndex(row.rowIndex, cell.cellIndex);
            var cellHasColspan = (cell.colSpan > 1);
            var cellHasRowspan = (cell.rowSpan > 1);
            var isThisSelectedCell = (row.rowIndex === _startPoint.rowPos && cell.cellIndex === _startPoint.colPos);
            setVirtualTablePosition(row.rowIndex, cellIndex, row, cell, cellHasRowspan, cellHasColspan, false);

            // Add span rows to virtual Table.
            var rowspanNumber = cell.attributes.rowSpan ? parseInt(cell.attributes.rowSpan.value, 10) : 0;
            if (rowspanNumber > 1) {
                for (var rp = 1; rp < rowspanNumber; rp++) {
                    var rowspanIndex = row.rowIndex + rp;
                    adjustStartPoint(rowspanIndex, cellIndex, cell, isThisSelectedCell);
                    setVirtualTablePosition(rowspanIndex, cellIndex, row, cell, true, cellHasColspan, true);
                }
            }

            // Add span cols to virtual table.
            var colspanNumber = cell.attributes.colSpan ? parseInt(cell.attributes.colSpan.value, 10) : 0;
            if (colspanNumber > 1) {
                for (var cp = 1; cp < colspanNumber; cp++) {
                    var cellspanIndex = recoverCellIndex(row.rowIndex, (cellIndex + cp));
                    adjustStartPoint(row.rowIndex, cellspanIndex, cell, isThisSelectedCell);
                    setVirtualTablePosition(row.rowIndex, cellspanIndex, row, cell, cellHasRowspan, true, true);
                }
            }
        }

        /**
        * Process validation and adjust of start point if needed
        *
        * @param {int} rowIndex
        * @param {int} cellIndex
        * @param {object} cell
        * @param {bool} isSelectedCell
        */
        function adjustStartPoint(rowIndex, cellIndex, cell, isSelectedCell) {
            if (rowIndex === _startPoint.rowPos && _startPoint.colPos >= cell.cellIndex && cell.cellIndex <= cellIndex && !isSelectedCell) {
                _startPoint.colPos++;
            }
        }

        /**
        * Create virtual table of cells with all cells, including span cells.
        */
        function createVirtualTable() {
            var rows = domTable.rows;
            for (var rowIndex = 0; rowIndex < rows.length; rowIndex++) {
                var cells = rows[rowIndex].cells;
                for (var cellIndex = 0; cellIndex < cells.length; cellIndex++) {
                    addCellInfoToVirtual(rows[rowIndex], cells[cellIndex]);
                }
            }
        }

        /**
        * Get action to be applied on the cell.
        *
        * @param {object} cell virtual table cell to apply action
        */
        function getDeleteResultActionToCell(cell) {
            switch (where) {
                case TableResultAction.where.Column:
                if (cell.isColSpan) {
                    return TableResultAction.resultAction.SubtractSpanCount;
                }
                break;
                case TableResultAction.where.Row:
                if (!cell.isVirtual && cell.isRowSpan) {
                    return TableResultAction.resultAction.AddCell;
                }
                else if (cell.isRowSpan) {
                    return TableResultAction.resultAction.SubtractSpanCount;
                }
                break;
            }
            return TableResultAction.resultAction.RemoveCell;
        }

        /**
        * Get action to be applied on the cell.
        *
        * @param {object} cell virtual table cell to apply action
        */
        function getAddResultActionToCell(cell) {
            switch (where) {
                case TableResultAction.where.Column:
                if (cell.isColSpan) {
                    return TableResultAction.resultAction.SumSpanCount;
                } else if(cell.isRowSpan && cell.isVirtual) {
                    return TableResultAction.resultAction.Ignore;
                }
                break;
                case TableResultAction.where.Row:
                if (cell.isRowSpan) {
                    return TableResultAction.resultAction.SumSpanCount;
                } else if (cell.isColSpan && cell.isVirtual) {
                    return TableResultAction.resultAction.Ignore;
                }
                break;
            }
            return TableResultAction.resultAction.AddCell;
        }

        function init() {
            setStartPoint();
            createVirtualTable();
        }

        //////////////////////////////////////////////
        // Public functions
        //////////////////////////////////////////////

        /**
        * Recover array os what to do in table.
        */
        this.getActionList = function () {
            var fixedRow = (where === TableResultAction.where.Row) ? _startPoint.rowPos : -1;
            var fixedCol = (where === TableResultAction.where.Column) ? _startPoint.colPos : -1;

            var actualPosition = 0;
            var canContinue = true;
            while (canContinue) {
                var rowPosition = (fixedRow >= 0) ? fixedRow : actualPosition;
                var colPosition = (fixedCol >= 0) ? fixedCol : actualPosition;
                var row = _virtualTable[rowPosition];
                if (!row) {
                    canContinue = false;
                    return _actionCellList;
                }
                var cell = row[colPosition];
                if (!cell) {
                    canContinue = false;
                    return _actionCellList;
                }

                // Define action to be applied in this cell
                var resultAction = TableResultAction.resultAction.Ignore;
                switch (action) {
                    case TableResultAction.requestAction.Add:
                    resultAction = getAddResultActionToCell(cell);
                    break;
                    case TableResultAction.requestAction.Delete:
                    resultAction = getDeleteResultActionToCell(cell);
                    break;
                }
                _actionCellList.push(getActionCell(cell, resultAction, rowPosition, colPosition));
                actualPosition++;
            }

            return _actionCellList;
        };

        init();
    };
    /**
    *
    * Where action occours enum.
    */
    TableResultAction.where = { 'Row': 0, 'Column': 1 };
    /**
    *
    * Requested action to apply enum.
    */
    TableResultAction.requestAction = { 'Add': 0, 'Delete': 1 };
    /**
    *
    * Result action to be executed enum.
    */
    TableResultAction.resultAction = { 'Ignore': 0, 'SubtractSpanCount': 1, 'RemoveCell': 2, 'AddCell': 3, 'SumSpanCount': 4 };

    /**
    *
    * @class editing.Table
    *
    * Table
    *
    */
    var Table = function () {
        /**
        * handle tab key
        *
        * @param {WrappedRange} rng
        * @param {Boolean} isShift
        */
        this.tab = function (rng, isShift) {
            var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
            var table = dom.ancestor(cell, dom.isTable);
            var cells = dom.listDescendant(table, dom.isCell);

            var nextCell = list[isShift ? 'prev' : 'next'](cells, cell);
            if (nextCell) {
                range.create(nextCell, 0).select();
            }
        };

        /**
        * Add a new row
        *
        * @param {WrappedRange} rng
        * @param {String} position (top/bottom)
        * @return {Node}
        */
        this.addRow = function (rng, position) {
            var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);

            var currentTr = $(cell).closest('tr');
            var trAttributes = this.recoverAttributes(currentTr);
            var html = $('<tr' + trAttributes + '></tr>');

            var vTable = new TableResultAction(cell, TableResultAction.where.Row,
                TableResultAction.requestAction.Add, $(currentTr).closest('table')[0]);
                var actions = vTable.getActionList();

                for (var idCell = 0; idCell < actions.length; idCell++) {
                    var currentCell = actions[idCell];
                    var tdAttributes = this.recoverAttributes(currentCell.baseCell);
                    switch (currentCell.action) {
                        case TableResultAction.resultAction.AddCell:
                        html.append('<td' + tdAttributes + '>' + dom.emptyTableCell + '</td>');
                        break;
                        case TableResultAction.resultAction.SumSpanCount:
                        if (position === 'top') {
                            var baseCellTr = currentCell.baseCell.parent;
                            var isTopFromRowSpan = (!baseCellTr ? 0 : currentCell.baseCell.closest('tr').rowIndex) <= currentTr[0].rowIndex;
                            if (isTopFromRowSpan) {
                                var newTd = $('<div></div>').append($('<td' + tdAttributes + '>' + dom.emptyTableCell + '</td>').removeAttr('rowspan')).html();
                                html.append(newTd);
                                break;
                            }
                        }
                        var rowspanNumber = parseInt(currentCell.baseCell.rowSpan, 10);
                        rowspanNumber++;
                        currentCell.baseCell.setAttribute('rowSpan', rowspanNumber);
                        break;
                    }
                }

                if (position === 'top') {
                    currentTr.before(html);
                }
                else {
                    var cellHasRowspan = (cell.rowSpan > 1);
                    if (cellHasRowspan) {
                        var lastTrIndex = currentTr[0].rowIndex + (cell.rowSpan - 2);
                        $($(currentTr).parent().find('tr')[lastTrIndex]).after($(html));
                        return;
                    }
                    currentTr.after(html);
                }
            };

            /**
            * Add a new col
            *
            * @param {WrappedRange} rng
            * @param {String} position (left/right)
            * @return {Node}
            */
            this.addCol = function (rng, position) {
                var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
                var row = $(cell).closest('tr');
                var rowsGroup = $(row).siblings();
                rowsGroup.push(row);

                var vTable = new TableResultAction(cell, TableResultAction.where.Column,
                    TableResultAction.requestAction.Add, $(row).closest('table')[0]);
                    var actions = vTable.getActionList();

                    for (var actionIndex = 0; actionIndex < actions.length; actionIndex++) {
                        var currentCell = actions[actionIndex];
                        var tdAttributes = this.recoverAttributes(currentCell.baseCell);

                        switch (currentCell.action) {
                            case TableResultAction.resultAction.AddCell:
                            if (actionIndex === 0) {
                                // add table header
                                if (position === 'right') {
                                    $(currentCell.baseCell).after('<th' + tdAttributes + '>' + dom.emptyTableHeaderCell + '</th>');
                                } else {
                                    $(currentCell.baseCell).before('<th' + tdAttributes + '>' + dom.emptyTableHeaderCell + '</th>');
                                }
                            }
                            else {
                                // add table cell
                                if (position === 'right') {
                                    $(currentCell.baseCell).after('<td' + tdAttributes + '>' + dom.emptyTableCell + '</td>');
                                } else {
                                    $(currentCell.baseCell).before('<td' + tdAttributes + '>' + dom.emptyTableCell + '</td>');
                                }
                            }
                            break;

                            case TableResultAction.resultAction.SumSpanCount:
                            if (position === 'right') {
                                var colspanNumber = parseInt(currentCell.baseCell.colSpan, 10);
                                colspanNumber++;
                                currentCell.baseCell.setAttribute('colSpan', colspanNumber);
                            } else {
                                $(currentCell.baseCell).before('<td' + tdAttributes + '>' + dom.emptyTableCell + '</td>');
                            }
                            break;
                        }
                    }
                };

                /*
                * Copy attributes from element.
                *
                * @param {object} Element to recover attributes.
                * @return {string} Copied string elements.
                */
                this.recoverAttributes = function (el) {
                    var resultStr = '';

                    if (!el) {
                        return resultStr;
                    }

                    var attrList = el.attributes || [];

                    for (var i = 0; i < attrList.length; i++) {
                        if (attrList[i].name.toLowerCase() === 'id') {
                            continue;
                        }

                        if (attrList[i].specified) {
                            resultStr += ' ' + attrList[i].name + '=\'' + attrList[i].value + '\'';
                        }
                    }

                    return resultStr;
                };

                /**
                * Delete current row
                *
                * @param {WrappedRange} rng
                * @return {Node}
                */
                this.deleteRow = function (rng) {
                    var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
                    var row = $(cell).closest('tr');
                    var cellPos = row.children('td, th').index($(cell));
                    var rowPos = row[0].rowIndex;

                    var vTable = new TableResultAction(cell, TableResultAction.where.Row,
                        TableResultAction.requestAction.Delete, $(row).closest('table')[0]);
                        var actions = vTable.getActionList();

                        for (var actionIndex = 0; actionIndex < actions.length; actionIndex++) {
                            if (!actions[actionIndex]) {
                                continue;
                            }

                            var baseCell = actions[actionIndex].baseCell;
                            var virtualPosition = actions[actionIndex].virtualTable;
                            var hasRowspan = (baseCell.rowSpan && baseCell.rowSpan > 1);
                            var rowspanNumber = (hasRowspan) ? parseInt(baseCell.rowSpan, 10) : 0;
                            switch (actions[actionIndex].action) {
                                case TableResultAction.resultAction.Ignore:
                                continue;
                                case TableResultAction.resultAction.AddCell:
                                var nextRow = row.next('tr')[0];
                                if (!nextRow) { continue; }
                                var cloneRow = row[0].cells[cellPos];
                                if (hasRowspan) {
                                    if (rowspanNumber > 2) {
                                        rowspanNumber--;
                                        nextRow.insertBefore(cloneRow, nextRow.cells[cellPos]);
                                        nextRow.cells[cellPos].setAttribute('rowSpan', rowspanNumber);
                                        nextRow.cells[cellPos].innerHTML = '';
                                    } else if (rowspanNumber === 2) {
                                        nextRow.insertBefore(cloneRow, nextRow.cells[cellPos]);
                                        nextRow.cells[cellPos].removeAttribute('rowSpan');
                                        nextRow.cells[cellPos].innerHTML = '';
                                    }
                                }
                                continue;
                                case TableResultAction.resultAction.SubtractSpanCount:
                                if (hasRowspan) {
                                    if (rowspanNumber > 2) {
                                        rowspanNumber--;
                                        baseCell.setAttribute('rowSpan', rowspanNumber);
                                        if (virtualPosition.rowIndex !== rowPos && baseCell.cellIndex === cellPos) { baseCell.innerHTML = ''; }
                                    } else if (rowspanNumber === 2) {
                                        baseCell.removeAttribute('rowSpan');
                                        if (virtualPosition.rowIndex !== rowPos && baseCell.cellIndex === cellPos) { baseCell.innerHTML = ''; }
                                    }
                                }
                                continue;
                                case TableResultAction.resultAction.RemoveCell:
                                // Do not need remove cell because row will be deleted.
                                continue;
                            }
                        }
                        row.remove();
                    };

                    /**
                    * Delete current col
                    *
                    * @param {WrappedRange} rng
                    * @return {Node}
                    */
                    this.deleteCol = function (rng) {
                        var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
                        var row = $(cell).closest('tr');
                        var cellPos = row.children('td, th').index($(cell));

                        var vTable = new TableResultAction(cell, TableResultAction.where.Column,
                            TableResultAction.requestAction.Delete, $(row).closest('table')[0]);
                            var actions = vTable.getActionList();

                            for (var actionIndex = 0; actionIndex < actions.length; actionIndex++) {
                                if (!actions[actionIndex]) {
                                    continue;
                                }
                                switch (actions[actionIndex].action) {
                                    case TableResultAction.resultAction.Ignore:
                                    continue;
                                    case TableResultAction.resultAction.SubtractSpanCount:
                                    var baseCell = actions[actionIndex].baseCell;
                                    var hasColspan = (baseCell.colSpan && baseCell.colSpan > 1);
                                    if (hasColspan) {
                                        var colspanNumber = (baseCell.colSpan) ? parseInt(baseCell.colSpan, 10) : 0;
                                        if (colspanNumber > 2) {
                                            colspanNumber--;
                                            baseCell.setAttribute('colSpan', colspanNumber);
                                            if (baseCell.cellIndex === cellPos) { baseCell.innerHTML = ''; }
                                        } else if (colspanNumber === 2) {
                                            baseCell.removeAttribute('colSpan');
                                            if (baseCell.cellIndex === cellPos) { baseCell.innerHTML = ''; }
                                        }
                                    }
                                    continue;
                                    case TableResultAction.resultAction.RemoveCell:
                                    dom.remove(actions[actionIndex].baseCell, true);
                                    continue;
                                }
                            }
                        };

                        /**
                        * create empty table element
                        *
                        * @param {Number} rowCount
                        * @param {Number} colCount
                        * @return {Node}
                        */
                        this.createTable = function (colCount, rowCount, tableOptions) {
                            var tds = [], tdHTML;

                            for (var idxCol = 0; idxCol < colCount; idxCol++) {
                                tds.push('<td>' + dom.emptyTableCell + '</td>');
                            }
                            tdHTML = tds.join('');

                            var trs = [], trHTML;

                            for (var idxRow = 0; idxRow < rowCount; idxRow++) {
                                trs.push('<tr>' + tdHTML + '</tr>');
                            }

                            var theader = [], thHTML;
                            for (idxCol = 0; idxCol < colCount; idxCol++) {
                                theader.push('<th>' + dom.emptyTableHeaderCell + '</th>');
                            }
                            thHTML = theader.join('');

                            trHTML = trs.join('');
                            var $table = $('<table><thead><tr>' + thHTML + '</tr></thead><tbody>' + trHTML + '</tbody></table>');

                            // handle table options
                            if (tableOptions) {
                                if (tableOptions.bordered) {
                                    $table.addClass('bordered');
                                }

                                if (tableOptions.striped) {
                                    $table.addClass('striped');
                                }

                                if (tableOptions.highlight) {
                                    $table.addClass('highlight');
                                }

                                if (tableOptions.responsive) {
                                    $table.addClass('responsive-table');
                                }

                                if (tableOptions.centered) {
                                    $table.addClass('centered');
                                }
                            }

                            return $table[0];
                        };

                        /**
                        * Delete current table
                        *
                        * @param {WrappedRange} rng
                        * @return {Node}
                        */
                        this.deleteTable = function (rng) {
                            var cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
                            $(cell).closest('table').remove();
                        };
                    };


    var KEY_BOGUS = 'bogus';

    /**
    * @class Editor
    */
    var Editor = function (context) {
        var self = this;

        var $note = context.layoutInfo.note;
        var $editor = context.layoutInfo.editor;
        var $editable = context.layoutInfo.editable;
        var options = context.options;
        var lang = options.langInfo;

        var editable = $editable[0];
        var lastRange = null;

        var style = new Style();
        var table = new Table();
        var typing = new Typing();
        var bullet = new Bullet();
        var history = new History($editable);

        this.initialize = function () {
            // bind custom events
            $editable.on('keydown', function (event) {
                if (event.keyCode === key.code.ENTER) {
                    context.triggerEvent('enter', event);
                }
                context.triggerEvent('keydown', event);

                if (!event.isDefaultPrevented()) {
                    if (options.shortcuts) {
                        self.handleKeyMap(event);
                    } else {
                        self.preventDefaultEditableShortCuts(event);
                    }
                }
            }).on('keyup', function (event) {
                context.triggerEvent('keyup', event);
            }).on('focus', function (event) {
                context.triggerEvent('focus', event);
            }).on('blur', function (event) {
                context.triggerEvent('blur', event);
            }).on('mousedown', function (event) {
                context.triggerEvent('mousedown', event);
            }).on('mouseup', function (event) {
                context.triggerEvent('mouseup', event);
            }).on('scroll', function (event) {
                context.triggerEvent('scroll', event);
            }).on('paste', function (event) {
                context.triggerEvent('paste', event);
            });

            // init content before set event
            $editable.html(dom.html($note) || dom.emptyPara);

            // [workaround] IE doesn't have input events for contentEditable
            // - see: https://goo.gl/4bfIvA
            var changeEventName = agent.isMSIE ? 'DOMCharacterDataModified DOMSubtreeModified DOMNodeInserted' : 'input';
            $editable.on(changeEventName, func.debounce(function () {
                context.triggerEvent('change', $editable.html());
            }, 250));

            $editor.on('focusin', function (event) {
                context.triggerEvent('focusin', event);
            }).on('focusout', function (event) {
                context.triggerEvent('focusout', event);
            });

            if (!options.airMode) {
                if (options.width) {
                    $editor.outerWidth(options.width);
                }
                if (options.height) {
                    $editable.outerHeight(options.height);
                }
                if (options.maxHeight) {
                    $editable.css('max-height', options.maxHeight);
                }
                if (options.minHeight) {
                    $editable.css('min-height', options.minHeight);
                }
            }

            history.recordUndo();
        };

        this.destroy = function () {
            $editable.off();
        };

        this.handleKeyMap = function (event) {
            var keyMap = options.keyMap[agent.isMac ? 'mac' : 'pc'];
            var keys = [];

            if (event.metaKey) { keys.push('CMD'); }
            if (event.ctrlKey && !event.altKey) { keys.push('CTRL'); }
            if (event.shiftKey) { keys.push('SHIFT'); }

            var keyName = key.nameFromCode[event.keyCode];
            if (keyName) {
                keys.push(keyName);
            }

            var eventName = keyMap[keys.join('+')];
            if (eventName) {
                event.preventDefault();
                context.invoke(eventName);
            } else if (key.isEdit(event.keyCode)) {
                this.afterCommand();
            }
        };

        this.preventDefaultEditableShortCuts = function (event) {
            // B(Bold, 66) / I(Italic, 73) / U(Underline, 85)
            if ((event.ctrlKey || event.metaKey) &&
            list.contains([66, 73, 85], event.keyCode)) {
                event.preventDefault();
            }
        };

        /**
        * create range
        * @return {WrappedRange}
        */
        this.createRange = function () {
            this.focus();
            return range.create(editable);
        };

        /**
        * saveRange
        *
        * save current range
        *
        * @param {Boolean} [thenCollapse=false]
        */
        this.saveRange = function (thenCollapse) {
            lastRange = this.createRange();
            if (thenCollapse) {
                lastRange.collapse().select();
            }
        };

        /**
        * restoreRange
        *
        * restore lately range
        */
        this.restoreRange = function () {
            if (lastRange) {
                lastRange.select();
                this.focus();
            }
        };

        this.saveTarget = function (node) {
            $editable.data('target', node);
        };

        this.clearTarget = function () {
            $editable.removeData('target');
        };

        this.restoreTarget = function () {
            return $editable.data('target');
        };

        /**
        * currentStyle
        *
        * current style
        * @return {Object|Boolean} unfocus
        */
        this.currentStyle = function () {
            var rng = range.create();
            if (rng) {
                rng = rng.normalize();
            }
            return rng ? style.current(rng) : style.fromNode($editable);
        };

        /**
        * style from node
        *
        * @param {jQuery} $node
        * @return {Object}
        */
        this.styleFromNode = function ($node) {
            return style.fromNode($node);
        };

        /**
        * undo
        */
        this.undo = function () {
            context.triggerEvent('before.command', $editable.html());
            history.undo();
            context.triggerEvent('change', $editable.html());
        };
        context.memo('help.undo', lang.help.undo);

        /**
        * redo
        */
        this.redo = function () {
            context.triggerEvent('before.command', $editable.html());
            history.redo();
            context.triggerEvent('change', $editable.html());
        };
        context.memo('help.redo', lang.help.redo);

        /**
        * before command
        */
        var beforeCommand = this.beforeCommand = function () {
            context.triggerEvent('before.command', $editable.html());
            // keep focus on editable before command execution
            self.focus();
        };

        /**
        * after command
        * @param {Boolean} isPreventTrigger
        */
        var afterCommand = this.afterCommand = function (isPreventTrigger) {
            history.recordUndo();

            if (!isPreventTrigger) {
                context.triggerEvent('change', $editable.html());
            }
        };

        /* jshint ignore:start */
        // native commands(with execCommand), generate function for execCommand
        var commands = ['bold', 'italic', 'underline', 'strikethrough', 'superscript', 'subscript',
        'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull',
        'formatBlock', 'removeFormat',
        'backColor', 'foreColor', 'fontName'];

        for (var idx = 0, len = commands.length; idx < len; idx ++) {
            this[commands[idx]] = (function (sCmd) {
                return function (value) {
                    beforeCommand();
                    document.execCommand(sCmd, false, value);
                    afterCommand(true);
                };
            })(commands[idx]);
            context.memo('help.' + commands[idx], lang.help[commands[idx]]);
        }
        /* jshint ignore:end */

        /**
        * handle tab key
        */
        this.tab = function () {
            var rng = this.createRange();
            if (rng.isCollapsed() && rng.isOnCell()) {
                table.tab(rng);
            } else {
                beforeCommand();
                typing.insertTab(rng, options.tabSize);
                afterCommand();
            }
        };
        context.memo('help.tab', lang.help.tab);

        /**
        * handle shift+tab key
        */
        this.untab = function () {
            var rng = this.createRange();
            if (rng.isCollapsed() && rng.isOnCell()) {
                table.tab(rng, true);
            }
        };
        context.memo('help.untab', lang.help.untab);

        /**
        * run given function between beforeCommand and afterCommand
        */
        this.wrapCommand = function(fn) {
            return function () {
                beforeCommand();
                fn.apply(self, arguments);
                afterCommand();
            };
        };

        /**
        * insert paragraph
        */
        this.insertParagraph = this.wrapCommand(function () {
            typing.insertParagraph(editable);
        });
        context.memo('help.insertParagraph', lang.help.insertParagraph);

        this.insertOrderedList = this.wrapCommand(function () {
            bullet.insertOrderedList(editable);
        });
        context.memo('help.insertOrderedList', lang.help.insertOrderedList);

        this.insertUnorderedList = this.wrapCommand(function () {
            bullet.insertUnorderedList(editable);
        });
        context.memo('help.insertUnorderedList', lang.help.insertUnorderedList);

        this.indent = this.wrapCommand(function () {
            bullet.indent(editable);
        });
        context.memo('help.indent', lang.help.indent);

        this.outdent = this.wrapCommand(function () {
            bullet.outdent(editable);
        });
        context.memo('help.outdent', lang.help.outdent);

        /**
        * insert card
        *
        * @param {String} backColor
        * @return {DOM}
        */
        this.insertCard = function (backColor, foreColor) {
            range.create(editable).insertNode($('<div class="card ' + backColor + '"><div class="card-content ' + foreColor + '">' +
            lang.materializeComponents.cardContentSample + '</div></div>')[0]);
        };

        /**
        * insert image
        *
        * @param {String} src
        * @param {String|Function} param
        * @return {Promise}
        */
        this.insertImage = function (src, param) {
            return async.createImage(src.images, param).then(function ($image) {
                beforeCommand();

                if (typeof param === 'function') {
                    param($image);
                } else {
                    if (typeof param === 'string') {
                        $image.attr('data-filename', param);
                    }
                    $image.css('width', Math.min($editable.width(), $image.width()));
                }

                $image = self.handleImageOptions($image, src.imageOptions);

                $image.show();
                range.create(editable).insertNode($image[0]);
                range.createFromNodeAfter($image[0]).select();
                afterCommand();
            }).fail(function (e) {
                context.triggerEvent('image.upload.error', e);
            });
        };

        /**
        * insertImages
        * @param {File[]} files
        */
        this.insertImages = function (files) {
            var imageOptions = files.imageOptions;

            $.each(files.images, function (idx, file) {
                var filename = file.name;
                if (options.maximumImageFileSize && options.maximumImageFileSize < file.size) {
                    context.triggerEvent('image.upload.error', lang.image.maximumFileSizeError);
                } else {
                    async.readFileAsDataURL(file).then(function (dataURL) {
                        return self.insertImage({images: dataURL, imageOptions: imageOptions}, filename);
                    }).fail(function () {
                        context.triggerEvent('image.upload.error');
                    });
                }
            });
        };

        /**
        * handle image options
        * @param {$image} jQuery image node
        * @param {Object} imageOptions
        */
        this.handleImageOptions = function($image, imageOptions) {
            if (imageOptions.responsive) {
                $image.addClass('responsive-img');
            }

            return $image;
        };

        /**
        * insertImagesOrCallback
        * @param {Object} files {images: Files[], imageOptions: Object{}}
        */
        this.insertImagesOrCallback = function (files) {
            var callbacks = options.callbacks;

            // If onImageUpload options setted
            if (callbacks.onImageUpload) {
                context.triggerEvent('image.upload', files);
                // else insert Image as dataURL
            } else {
                this.insertImages(files);
            }
        };

        /**
        * insertNode
        * insert node
        * @param {Node} node
        */
        this.insertNode = this.wrapCommand(function (node) {
            var rng = this.createRange();
            rng.insertNode(node);
            range.createFromNodeAfter(node).select();
        });

        /**
        * insert text
        * @param {String} text
        */
        this.insertText = this.wrapCommand(function (text) {
            var rng = this.createRange();
            var textNode = rng.insertNode(dom.createText(text));
            range.create(textNode, dom.nodeLength(textNode)).select();
        });

        /**
        * return selected plain text
        * @return {String} text
        */
        this.getSelectedText = function () {
            var rng = this.createRange();

            // if range on anchor, expand range with anchor
            if (rng.isOnAnchor()) {
                rng = range.createFromNode(dom.ancestor(rng.sc, dom.isAnchor));
            }

            return rng.toString();
        };

        /**
        * paste HTML
        * @param {String} markup
        */
        this.pasteHTML = this.wrapCommand(function (markup) {
            var contents = this.createRange().pasteHTML(markup);
            range.createFromNodeAfter(list.last(contents)).select();
        });

        /**
        * formatBlock
        *
        * @param {String} tagName
        */
        this.formatBlock = this.wrapCommand(function (tagName, $target) {
            var onApplyCustomStyle = context.options.callbacks.onApplyCustomStyle;
            if (onApplyCustomStyle) {
                onApplyCustomStyle.call(this, $target, context, this.onFormatBlock);
            } else {
                this.onFormatBlock(tagName);
            }
        });

        this.onFormatBlock = function (tagName) {
            // [workaround] for MSIE, IE need `<`
            tagName = agent.isMSIE ? '<' + tagName + '>' : tagName;
            document.execCommand('FormatBlock', false, tagName);
        };

        this.formatPara = function () {
            this.formatBlock('P');
        };
        context.memo('help.formatPara', lang.help.formatPara);

        /* jshint ignore:start */
        for (var idx = 1; idx <= 6; idx ++) {
            this['formatH' + idx] = function (idx) {
                return function () {
                    this.formatBlock('H' + idx);
                };
            }(idx);
            context.memo('help.formatH'+idx, lang.help['formatH' + idx]);
        };
        /* jshint ignore:end */

        /**
        * fontSize
        *
        * @param {String} value - px
        */
        this.fontSize = function (value) {
            var rng = this.createRange();

            if (rng && rng.isCollapsed()) {
                var spans = style.styleNodes(rng);
                var firstSpan = list.head(spans);

                $(spans).css({
                    'font-size': value + 'px'
                });

                // [workaround] added styled bogus span for style
                //  - also bogus character needed for cursor position
                if (firstSpan && !dom.nodeLength(firstSpan)) {
                    firstSpan.innerHTML = dom.ZERO_WIDTH_NBSP_CHAR;
                    range.createFromNodeAfter(firstSpan.firstChild).select();
                    $editable.data(KEY_BOGUS, firstSpan);
                }
            } else {
                beforeCommand();
                $(style.styleNodes(rng)).css({
                    'font-size': value + 'px'
                });
                afterCommand();
            }
        };

        /**
        * insert horizontal rule
        */
        this.insertHorizontalRule = this.wrapCommand(function () {
            var hrNode = this.createRange().insertNode(dom.create('HR'));
            if (hrNode.nextSibling) {
                range.create(hrNode.nextSibling, 0).normalize().select();
            }
        });
        context.memo('help.insertHorizontalRule', lang.help.insertHorizontalRule);

        /**
        * remove bogus node and character
        */
        this.removeBogus = function () {
            var bogusNode = $editable.data(KEY_BOGUS);
            if (!bogusNode) {
                return;
            }

            var textNode = list.find(list.from(bogusNode.childNodes), dom.isText);

            var bogusCharIdx = textNode.nodeValue.indexOf(dom.ZERO_WIDTH_NBSP_CHAR);
            if (bogusCharIdx !== -1) {
                textNode.deleteData(bogusCharIdx, 1);
            }

            if (dom.isEmpty(bogusNode)) {
                dom.remove(bogusNode);
            }

            $editable.removeData(KEY_BOGUS);
        };

        /**
        * lineHeight
        * @param {String} value
        */
        this.lineHeight = this.wrapCommand(function (value) {
            style.stylePara(this.createRange(), {
                lineHeight: value
            });
        });

        /**
        * unlink
        *
        * @type command
        */
        this.unlink = function () {
            var rng = this.createRange();
            if (rng.isOnAnchor()) {
                var anchor = dom.ancestor(rng.sc, dom.isAnchor);
                rng = range.createFromNode(anchor);
                rng.select();

                beforeCommand();
                document.execCommand('unlink');
                afterCommand();
            }
        };

        /**
        * create link (command)
        *
        * @param {Object} linkInfo
        */
        this.createLink = this.wrapCommand(function (linkInfo) {
            var linkUrl = linkInfo.url;
            var linkText = linkInfo.text;
            var isNewWindow = linkInfo.isNewWindow;
            var rng = linkInfo.range || this.createRange();
            var isTextChanged = rng.toString() !== linkText;

            // handle spaced urls from input
            if (typeof linkUrl === 'string') {
                linkUrl = linkUrl.trim();
            }

            if (options.onCreateLink) {
                linkUrl = options.onCreateLink(linkUrl);
            }

            var anchors = [];

            if (isTextChanged) {
                rng = rng.deleteContents();
                var anchor = rng.insertNode($('<A>' + linkText + '</A>')[0]);
                anchors.push(anchor);
            } else {
                anchors = style.styleNodes(rng, {
                    nodeName: 'A',
                    expandClosestSibling: true,
                    onlyPartialContains: true
                });
            }

            $.each(anchors, function (idx, anchor) {
                $(anchor).attr('href', linkUrl);
                if (isNewWindow) {
                    $(anchor).attr('target', '_blank');
                } else {
                    $(anchor).removeAttr('target');
                }
            });

            var startRange = range.createFromNodeBefore(list.head(anchors));
            var startPoint = startRange.getStartPoint();
            var endRange = range.createFromNodeAfter(list.last(anchors));
            var endPoint = endRange.getEndPoint();

            range.create(
                startPoint.node,
                startPoint.offset,
                endPoint.node,
                endPoint.offset
            ).select();
        });

        /**
        * returns link info
        *
        * @return {Object}
        * @return {WrappedRange} return.range
        * @return {String} return.text
        * @return {Boolean} [return.isNewWindow=true]
        * @return {String} [return.url=""]
        */
        this.getLinkInfo = function() {
            var rng = this.createRange().expand(dom.isAnchor);

            // Get the first anchor on range(for edit).
            var $anchor = $(list.head(rng.nodes(dom.isAnchor)));
            var linkInfo = {
                range: rng,
                text: rng.toString(),
                url: $anchor.length ? $anchor.attr('href') : ''
            };

            // Define isNewWindow when anchor exists.
            if ($anchor.length) {
                linkInfo.isNewWindow = $anchor.attr('target') === '_blank';
            }

            return linkInfo;
        };

        /**
        * returns image info
        *
        * @param {DOM element} imageDom
        * @return {Boolean} imageInfo.responsive
        * @return {Number} (or undefined) imageInfo.size
        * @return {String} (or undefined) imageInfo.float
        */
        this.getImageInfo = function(imageDom) {
            let $image = $(imageDom);
            let styles = context.getInlineStyles($image);
            let imageInfo = {
                responsive: $image.hasClass('responsive-img') ? true : false
            };

            // handle inline style attribute of the image
            for (let key in styles) {
                if (styles.hasOwnProperty(key)) {
                    let value = styles[key];

                    // handle styles
                    switch(key) {
                        case 'width':
                            switch(value) {
                                case '100%':
                                imageInfo.size = 100;
                                break;

                                case '50%':
                                imageInfo.size = 50;
                                break;

                                case '25%':
                                imageInfo.size = 25;
                                break;
                            }
                        break;

                        default:
                            imageInfo[key] = value;
                    }
                }
            }
            return imageInfo;
        };

        /**
        * returns table info
        *
        * @param {DOM element} imageDom
        * @return {Boolean} imageInfo.responsive
        * @return {Number} (or undefined) imageInfo.size
        * @return {String} (or undefined) imageInfo.float
        */
        this.getTableInfo = function(tableDom) {
            let $table = $(tableDom).closest('table');
            let tableInfo = {
                bordered: $table.hasClass('bordered') ? true : false,
                striped: $table.hasClass('striped') ? true : false,
                highlighted: $table.hasClass('highlight') ? true : false,
                responsive: $table.hasClass('responsive-table') ? true : false,
                centered: $table.hasClass('centered') ? true : false
            };

            return tableInfo;
        };

        /**
        * setting color
        *
        * @param {Object} sObjColor  color code
        * @param {String} sObjColor.foreColor foreground color
        * @param {String} sObjColor.backColor background color
        */
        this.color = this.wrapCommand(function (colorInfo) {
            let foreColor = colorInfo.foreColor;
            let backColor = colorInfo.backColor;

            if (foreColor) { document.execCommand('foreColor', false, foreColor); }
            if (backColor) { document.execCommand('backColor', false, backColor); }
        });

        /**
        * insert Table
        *
        * @param {String} dimension of table (ex : "5x5")
        */
        this.insertTable = this.wrapCommand(function (tableOptions) {
            var dimension = tableOptions.dim.split('x');

            var rng = this.createRange().deleteContents();
            rng.insertNode(table.createTable(dimension[0], dimension[1], tableOptions));
        });

        /**
        * add or remove materialize's classes to table
        */
        this.updateTable = function(option) {
            let rng = this.createRange($editable);
            let cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
            let $table = $(cell).closest('table');

            beforeCommand();
            $table.toggleClass(option);

            afterCommand(true);
            context.triggerEvent('change', $table[0]);
        };

        /**
        * @method addRow
        *
        *
        */
        this.addRow = function (position) {
            let rng = this.createRange($editable);
            let cell = dom.ancestor(rng.commonAncestor(), dom.isCell);

            if (rng.isCollapsed() && rng.isOnCell()) {
                beforeCommand();
                table.addRow(rng, position);
                afterCommand(true);
                context.triggerEvent('change', cell);
            }
        };

        /**
        * @method addCol
        *
        *
        */
        this.addCol = function (position) {
            let rng = this.createRange($editable);
            let cell = dom.ancestor(rng.commonAncestor(), dom.isCell);

            if (rng.isCollapsed() && rng.isOnCell()) {
                beforeCommand();
                table.addCol(rng, position);
                afterCommand(true);
                context.triggerEvent('change', cell);
            }
        };

        /**
        * @method deleteRow
        *
        *
        */
        this.deleteRow = function () {
            let rng = this.createRange($editable);
            let cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
            let $cell = $(cell);
            let currentRow = $cell.parent();
            let currentTargetIndex = $cell.siblings().andSelf().index(cell);
            currentTargetIndex++;
            // set newTarget to prev or next row, same column
            let newTarget = currentRow.prev('tr').children('td:nth-child(' + currentTargetIndex + ')');

            if (newTarget.length === 0) {
                newTarget = currentRow.next('tr').children('td:nth-child(' + currentTargetIndex + ')');
            }

            if (rng.isCollapsed() && rng.isOnCell()) {
                beforeCommand();
                table.deleteRow(rng);
                afterCommand(true);

                // move popover to new target (keep it opened)
                if (newTarget.length !== 0) {
                    context.triggerEvent('change', newTarget[0]);
                    let range = document.createRange();
                    let sel = window.getSelection();
                    range.setStart(newTarget[0], 1);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                else {
                    context.triggerEvent('change');
                }
            }
        };

        /**
        * @method deleteCol
        *
        *
        */
        this.deleteCol = function () {
            let rng = this.createRange($editable);
            let cell = dom.ancestor(rng.commonAncestor(), dom.isCell);
            let $cell = $(cell);
            // set newTarget to prev or next column, same row
            let newTarget = $cell.prev('td');

            if (newTarget.length === 0) {
                newTarget = $cell.next('td');
            }

            if (rng.isCollapsed() && rng.isOnCell()) {
                beforeCommand();
                table.deleteCol(rng);
                afterCommand(true);

                // move popover to new target (keep it opened)
                if (newTarget.length !== 0) {
                    context.triggerEvent('change', newTarget[0]);
                    let range = document.createRange();
                    let sel = window.getSelection();
                    range.setStart(newTarget[0], 1);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                else {
                    context.triggerEvent('change');
                }
            }
        };

        /**
        * @method deleteTable
        *
        *
        */
        this.deleteTable = function () {
            var rng = this.createRange($editable);
            if (rng.isCollapsed() && rng.isOnCell()) {
                beforeCommand();
                table.deleteTable(rng);
                afterCommand();
            }
        };

        /**
        * float me
        *
        * @param {String} value
        */
        this.floatMe = function(value) {
            var $target = $(this.restoreTarget());

            beforeCommand();
            $target.css('float', value);

            afterCommand(true);
            context.triggerEvent('change', $target[0]);
        };

        /**
        * resize overlay element
        * @param {String} value
        */
        this.resize = function(dim) {
            let $target = $(this.restoreTarget());
            let styles = context.getInlineStyles($target);
            let percentageDim = dim * 100 + '%';

            beforeCommand();
            if (styles.width === percentageDim) {
                $target.css({
                    width: 'auto'
                });
            }
            else {
                $target.css({
                    width: percentageDim,
                    height: ''
                });
            }

            afterCommand(true);
            context.triggerEvent('change', $target[0]);
        };

        /**
        * add or remove materialize's responsive class to image
        */
        this.responsivize = function() {
            let $target = $(this.restoreTarget());

            beforeCommand();
            $target.toggleClass('responsive-img');

            afterCommand(true);
            context.triggerEvent('change', $target[0]);
        };

        /**
        * add or remove target="_blank" to/from a link
        */
        this.toggleOpenInNewWindow = function() {
            let rng = this.createRange().expand(dom.isAnchor);

            // Get the first anchor on range(for edit).
            let $anchor = $(list.head(rng.nodes(dom.isAnchor)));
            let linkTarget = $anchor.attr('target');

            beforeCommand();
            linkTarget === '_blank' ? $anchor.attr('target', '_self') : $anchor.attr('target', '_blank');

            afterCommand(true);
            context.triggerEvent('change', $anchor[0]);
        };

        /**
        * @param {Position} pos
        * @param {jQuery} $target - target element
        * @param {Boolean} [bKeepRatio] - keep ratio
        */
        this.resizeTo = function (pos, $target, bKeepRatio) {
            var imageSize;
            if (bKeepRatio) {
                var newRatio = pos.y / pos.x;
                var ratio = $target.data('ratio');
                imageSize = {
                    width: ratio > newRatio ? pos.x : pos.y / ratio,
                    height: ratio > newRatio ? pos.x * ratio : pos.y
                };
            } else {
                imageSize = {
                    width: pos.x,
                    height: pos.y
                };
            }

            $target.css(imageSize);
        };

        /**
        * remove media object
        */
        this.removeMedia = this.wrapCommand(function () {
            var $target = $(this.restoreTarget()).detach();
            context.triggerEvent('media.delete', $target, $editable);
        });

        /**
        * returns whether editable area has focus or not.
        */
        this.hasFocus = function () {
            return $editable.is(':focus');
        };

        /**
        * set focus
        */
        this.focus = function () {
            // [workaround] Screen will move when page is scolled in IE.
            //  - do focus when not focused
            if (!this.hasFocus()) {
                $editable.focus();
            }
        };

        /**
        * returns whether contents is empty or not.
        * @return {Boolean}
        */
        this.isEmpty = function () {
            return dom.isEmpty($editable[0]) || dom.emptyPara === $editable.html();
        };

        /**
        * Removes all contents and restores the editable instance to an _emptyPara_.
        */
        this.empty = function () {
            context.invoke('code', dom.emptyPara);
        };
    };

  var Clipboard = function (context) {
    var self = this;

    var $editable = context.layoutInfo.editable;

    this.events = {
      'materialnote.keydown': function (we, e) {
        if (self.needKeydownHook()) {
          if ((e.ctrlKey || e.metaKey) && e.keyCode === key.code.V) {
            context.invoke('editor.saveRange');
            self.$paste.focus();

            setTimeout(function () {
              self.pasteByHook();
            }, 0);
          }
        }
      }
    };

    this.needKeydownHook = function () {
      return (agent.isMSIE && agent.browserVersion > 10) || agent.isFF;
    };

    this.initialize = function () {
      // [workaround] getting image from clipboard
      //  - IE11 and Firefox: CTRL+v hook
      //  - Webkit: event.clipboardData
      if (this.needKeydownHook()) {
        this.$paste = $('<div tabindex="-1" />').attr('contenteditable', true).css({
          position: 'absolute',
          left: -100000,
          opacity: 0
        });
        $editable.before(this.$paste);

        this.$paste.on('paste', function (event) {
          context.triggerEvent('paste', event);
        });
      } else {
        $editable.on('paste', this.pasteByEvent);
      }
    };

    this.destroy = function () {
      if (this.needKeydownHook()) {
        this.$paste.remove();
        this.$paste = null;
      }
    };

    this.pasteByHook = function () {
      var node = this.$paste[0].firstChild;

      var src = node && node.src;
      if (dom.isImg(node) && src.indexOf('data:') === 0) {
        var decodedData = atob(node.src.split(',')[1]);
        var array = new Uint8Array(decodedData.length);
        for (var i = 0; i < decodedData.length; i++) {
          array[i] = decodedData.charCodeAt(i);
        }

        var blob = new Blob([array], { type: 'image/png' });
        blob.name = 'clipboard.png';

        context.invoke('editor.restoreRange');
        context.invoke('editor.focus');
        context.invoke('editor.insertImagesOrCallback', [blob]);
      } else {
        var pasteContent = $('<div />').html(this.$paste.html()).html();
        context.invoke('editor.restoreRange');
        context.invoke('editor.focus');

        if (pasteContent) {
          context.invoke('editor.pasteHTML', pasteContent);
        }
      }

      this.$paste.empty();
    };

    /**
     * paste by clipboard event
     *
     * @param {Event} event
     */
    this.pasteByEvent = function (event) {
      var clipboardData = event.originalEvent.clipboardData;
      if (clipboardData && clipboardData.items && clipboardData.items.length) {
        var item = list.head(clipboardData.items);
        if (item.kind === 'file' && item.type.indexOf('image/') !== -1) {
          context.invoke('editor.insertImagesOrCallback', [item.getAsFile()]);
        }
        context.invoke('editor.afterCommand');
      }
    };
  };

  var Dropzone = function (context) {
    var $document = $(document);
    var $editor = context.layoutInfo.editor;
    var $editable = context.layoutInfo.editable;
    var options = context.options;
    var lang = options.langInfo;
    var documentEventHandlers = {};

    var $dropzone = $([
      '<div class="note-dropzone">',
      '  <div class="note-dropzone-message"/>',
      '</div>'
    ].join('')).prependTo($editor);

    var detachDocumentEvent = function () {
      Object.keys(documentEventHandlers).forEach(function (key) {
        $document.off(key.substr(2).toLowerCase(), documentEventHandlers[key]);
      });
      documentEventHandlers = {};
    };

    /**
     * attach Drag and Drop Events
     */
    this.initialize = function () {
      if (options.disableDragAndDrop) {
        // prevent default drop event
        documentEventHandlers.onDrop = function (e) {
          e.preventDefault();
        };
        $document.on('drop', documentEventHandlers.onDrop);
      } else {
        this.attachDragAndDropEvent();
      }
    };

    /**
     * attach Drag and Drop Events
     */
    this.attachDragAndDropEvent = function () {
      var collection = $(),
          $dropzoneMessage = $dropzone.find('.note-dropzone-message');

      documentEventHandlers.onDragenter = function (e) {
        var isCodeview = context.invoke('codeview.isActivated');
        var hasEditorSize = $editor.width() > 0 && $editor.height() > 0;
        if (!isCodeview && !collection.length && hasEditorSize) {
          $editor.addClass('dragover');
          $dropzone.width($editor.width());
          $dropzone.height($editor.height());
          $dropzoneMessage.text(lang.image.dragImageHere);
        }
        collection = collection.add(e.target);
      };

      documentEventHandlers.onDragleave = function (e) {
        collection = collection.not(e.target);
        if (!collection.length) {
          $editor.removeClass('dragover');
        }
      };

      documentEventHandlers.onDrop = function () {
        collection = $();
        $editor.removeClass('dragover');
      };

      // show dropzone on dragenter when dragging a object to document
      // -but only if the editor is visible, i.e. has a positive width and height
      $document.on('dragenter', documentEventHandlers.onDragenter)
        .on('dragleave', documentEventHandlers.onDragleave)
        .on('drop', documentEventHandlers.onDrop);

      // change dropzone's message on hover.
      $dropzone.on('dragenter', function () {
        $dropzone.addClass('hover');
        $dropzoneMessage.text(lang.image.dropImage);
      }).on('dragleave', function () {
        $dropzone.removeClass('hover');
        $dropzoneMessage.text(lang.image.dragImageHere);
      });

      // attach dropImage
      $dropzone.on('drop', function (event) {
        var dataTransfer = event.originalEvent.dataTransfer;

        if (dataTransfer && dataTransfer.files && dataTransfer.files.length) {
          event.preventDefault();
          $editable.focus();
          context.invoke('editor.insertImagesOrCallback', dataTransfer.files);
        } else {
          $.each(dataTransfer.types, function (idx, type) {
            var content = dataTransfer.getData(type);

            if (type.toLowerCase().indexOf('text') > -1) {
              context.invoke('editor.pasteHTML', content);
            } else {
              $(content).each(function () {
                context.invoke('editor.insertNode', this);
              });
            }
          });
        }
      }).on('dragover', false); // prevent default dragover event
    };

    this.destroy = function () {
      detachDocumentEvent();
    };
  };


    var CodeMirror;
    if (agent.hasCodeMirror) {
        if (agent.isSupportAmd) {
            require(['codemirror'], function (cm) {
                CodeMirror = cm;
            });
        } else {
            CodeMirror = window.CodeMirror;
        }
    }

    /**
    * @class Codeview
    */
    var Codeview = function (context) {
        var $editor = context.layoutInfo.editor;
        var $editable = context.layoutInfo.editable;
        var $codable = context.layoutInfo.codable;
        var options = context.options;

        this.sync = function () {
            var isCodeview = this.isActivated();
            if (isCodeview && agent.hasCodeMirror) {
                $codable.data('cmEditor').save();
            }
        };

        /**
        * @return {Boolean}
        */
        this.isActivated = function () {
            return $editor.hasClass('codeview');
        };

        /**
        * toggle codeview
        */
        this.toggle = function () {
            if (this.isActivated()) {
                this.deactivate();
            } else {
                this.activate();
            }
            context.triggerEvent('codeview.toggled');
        };

        /**
        * activate code view
        */
        this.activate = function () {
            $codable.val(dom.html($editable, options.prettifyHtml));
            $codable.height($editable.height());

            context.invoke('toolbar.updateCodeview', true);
            $editor.addClass('codeview');
            $codable.focus();

            // activate CodeMirror as codable
            if (agent.hasCodeMirror) {
                var cmEditor = CodeMirror.fromTextArea($codable[0], options.codemirror);

                // CodeMirror TernServer
                if (options.codemirror.tern) {
                    var server = new CodeMirror.TernServer(options.codemirror.tern);
                    cmEditor.ternServer = server;
                    cmEditor.on('cursorActivity', function (cm) {
                        server.updateArgHints(cm);
                    });
                }

                // CodeMirror hasn't Padding.
                cmEditor.setSize(null, $editable.outerHeight());
                $codable.data('cmEditor', cmEditor);
            }
        };

        /**
        * deactivate code view
        */
        this.deactivate = function () {
            // deactivate CodeMirror as codable
            if (agent.hasCodeMirror) {
                var cmEditor = $codable.data('cmEditor');
                $codable.val(cmEditor.getValue());
                cmEditor.toTextArea();
            }

            var value = dom.value($codable, options.prettifyHtml) || dom.emptyPara;
            var isChange = $editable.html() !== value;

            $editable.html(value);
            $editable.height(options.height ? $codable.height() : 'auto');
            $editor.removeClass('codeview');

            if (isChange) {
                context.triggerEvent('change', $editable.html(), $editable);
            }

            $editable.focus();

            context.invoke('toolbar.updateCodeview', false);
        };

        this.destroy = function () {
            if (this.isActivated()) {
                this.deactivate();
            }
        };
    };

  var EDITABLE_PADDING = 24;

  var Statusbar = function (context) {
    var $document = $(document);
    var $statusbar = context.layoutInfo.statusbar;
    var $editable = context.layoutInfo.editable;
    var options = context.options;

    this.initialize = function () {
      if (options.airMode || options.disableResizeEditor) {
        this.destroy();
        return;
      }

      $statusbar.on('mousedown', function (event) {
        event.preventDefault();
        event.stopPropagation();

        var editableTop = $editable.offset().top - $document.scrollTop();
        var onMouseMove = function (event) {
          var height = event.clientY - (editableTop + EDITABLE_PADDING);

          height = (options.minheight > 0) ? Math.max(height, options.minheight) : height;
          height = (options.maxHeight > 0) ? Math.min(height, options.maxHeight) : height;

          $editable.height(height);
        };

        $document
          .on('mousemove', onMouseMove)
          .one('mouseup', function () {
            $document.off('mousemove', onMouseMove);
          });
      });
    };

    this.destroy = function () {
      $statusbar.off();
      $statusbar.remove();
    };
  };

    var Fullscreen = function (context) {
        var self = this;
        var $editor = context.layoutInfo.editor;
        var $toolbar = context.layoutInfo.toolbar;
        var $editable = context.layoutInfo.editable;
        var $codable = context.layoutInfo.codable;

        var $window = $(window);
        var $scrollbar = $('html, body');

        this.resizeTo = function (size) {
            $editable.css('height', size.h);
            $codable.css('height', size.h);
            if ($codable.data('cmeditor')) {
                $codable.data('cmeditor').setsize(null, size.h);
            }
        };

        this.onResize = function () {
            self.resizeTo({
                h: $window.height() - $toolbar.outerHeight()
            });
        };

        /**
        * toggle fullscreen
        */
        this.toggle = function () {
            $editor.toggleClass('fullscreen');
            if (this.isFullscreen()) {
                $editable.data('orgHeight', $editable.css('height'));
                $window.on('resize', this.onResize).trigger('resize');
                $scrollbar.css('overflow', 'hidden');
                $toolbar.css({width: '100%'});
            } else {
                $window.off('resize', this.onResize);
                this.resizeTo({ h: $editable.data('orgHeight') });
                $scrollbar.css('overflow', 'visible');
            }

            context.invoke('toolbar.updateFullscreen', this.isFullscreen());
        };

        this.isFullscreen = function () {
            return $editor.hasClass('fullscreen');
        };
    };

    var Handle = function (context) {
        var self = this;

        var $document = $(document);
        var $editingArea = context.layoutInfo.editingArea;
        var options = context.options;

        this.events = {
            'materialnote.mousedown': function (we, e) {
                if (self.update(e.target)) {
                    e.preventDefault();
                }
            },
            'materialnote.keyup materialnote.scroll materialnote.dialog.shown': function () {
                self.update();
            },
            'materialnote.change': function(event, target) {
                self.update(target);
            },
            'materialnote.disable': function () {
                self.hide();
            }
        };

        this.initialize = function () {
            this.$handle = $([
                '<div class="note-handle">',
                '<div class="note-control-selection">',
                '<div class="note-control-selection-bg"></div>',
                '<div class="note-control-holder note-control-nw"></div>',
                '<div class="note-control-holder note-control-ne"></div>',
                '<div class="note-control-holder note-control-sw"></div>',
                '<div class="',
                (options.disableResizeImage ? 'note-control-holder' : 'note-control-sizing'),
                ' note-control-se"></div>',
                (options.disableResizeImage ? '' : '<div class="note-control-selection-info"></div>'),
                '</div>',
                '</div>'
            ].join('')).prependTo($editingArea);

            this.$handle.on('mousedown', function (event) {
                if (dom.isControlSizing(event.target)) {
                    event.preventDefault();
                    event.stopPropagation();

                    var $target = self.$handle.find('.note-control-selection').data('target'),
                    posStart = $target.offset(),
                    scrollTop = $document.scrollTop();

                    var onMouseMove = function (event) {
                        context.invoke('editor.resizeTo', {
                            x: event.clientX - posStart.left,
                            y: event.clientY - (posStart.top - scrollTop)
                        }, $target, !event.shiftKey);

                        self.update($target[0]);
                    };

                    $document
                    .on('mousemove', onMouseMove)
                    .one('mouseup', function (e) {
                        e.preventDefault();
                        $document.off('mousemove', onMouseMove);
                        context.invoke('editor.afterCommand');
                    });

                    if (!$target.data('ratio')) { // original ratio.
                        $target.data('ratio', $target.height() / $target.width());
                    }
                }
            });
        };

        this.destroy = function () {
            this.$handle.remove();
        };

        this.update = function (target) {
            if (context.isDisabled()) {
                return false;
            }

            var isImage = dom.isImg(target);
            var $selection = this.$handle.find('.note-control-selection');

            context.invoke('imagePopover.update', target);

            if (isImage) {
                var $image = $(target);
                var pos = $image.position();

                // include margin
                var imageSize = {
                    w: $image.outerWidth(true),
                    h: $image.outerHeight(true)
                };

                $selection.css({
                    display: 'block',
                    left: pos.left,
                    top: pos.top,
                    width: imageSize.w,
                    height: imageSize.h
                }).data('target', $image); // save current image element.

                var sizingText = imageSize.w + 'x' + imageSize.h;
                $selection.find('.note-control-selection-info').text(sizingText);
                context.invoke('editor.saveTarget', target);
            } else {
                this.hide();
            }

            return isImage;
        };

        /**
        * hide
        *
        * @param {jQuery} $handle
        */
        this.hide = function () {
            context.invoke('editor.clearTarget');
            this.$handle.children().hide();
        };
    };

  var AutoLink = function (context) {
    var self = this;
    var defaultScheme = 'http://';
    var linkPattern = /^([A-Za-z][A-Za-z0-9+-.]*\:[\/\/]?|mailto:[A-Z0-9._%+-]+@)?(www\.)?(.+)$/i;

    this.events = {
      'materialnote.keyup': function (we, e) {
        if (!e.isDefaultPrevented()) {
          self.handleKeyup(e);
        }
      },
      'materialnote.keydown': function (we, e) {
        self.handleKeydown(e);
      }
    };

    this.initialize = function () {
      this.lastWordRange = null;
    };

    this.destroy = function () {
      this.lastWordRange = null;
    };

    this.replace = function () {
      if (!this.lastWordRange) {
        return;
      }

      var keyword = this.lastWordRange.toString();
      var match = keyword.match(linkPattern);

      if (match && (match[1] || match[2])) {
        var link = match[1] ? keyword : defaultScheme + keyword;
        var node = $('<a />').html(keyword).attr('href', link)[0];

        this.lastWordRange.insertNode(node);
        this.lastWordRange = null;
        context.invoke('editor.focus');
      }

    };

    this.handleKeydown = function (e) {
      if (list.contains([key.code.ENTER, key.code.SPACE], e.keyCode)) {
        var wordRange = context.invoke('editor.createRange').getWordRange();
        this.lastWordRange = wordRange;
      }
    };

    this.handleKeyup = function (e) {
      if (list.contains([key.code.ENTER, key.code.SPACE], e.keyCode)) {
        this.replace();
      }
    };
  };

  /**
   * textarea auto sync.
   */
  var AutoSync = function (context) {
    var $note = context.layoutInfo.note;

    this.events = {
      'materialnote.change': function () {
        $note.val(context.invoke('code'));
      }
    };

    this.shouldInitialize = function () {
      return dom.isTextarea($note[0]);
    };
  };

  var Placeholder = function (context) {
    var self = this;
    var $editingArea = context.layoutInfo.editingArea;
    var options = context.options;

    this.events = {
      'materialnote.init materialnote.change': function () {
        self.update();
      },
      'materialnote.codeview.toggled': function () {
        self.update();
      }
    };

    this.shouldInitialize = function () {
      return !!options.placeholder;
    };

    this.initialize = function () {
      this.$placeholder = $('<div class="note-placeholder">');
      this.$placeholder.on('click', function () {
        context.invoke('focus');
      }).text(options.placeholder).prependTo($editingArea);
    };

    this.destroy = function () {
      this.$placeholder.remove();
    };

    this.update = function () {
      var isShow = !context.invoke('codeview.isActivated') && context.invoke('editor.isEmpty');
      this.$placeholder.toggle(isShow);
    };
  };

    var Buttons = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var $toolbar = context.layoutInfo.toolbar;
        var options = context.options;
        var lang = options.langInfo;

        var invertedKeyMap = func.invertObject(options.keyMap[agent.isMac ? 'mac' : 'pc']);

        var representShortcut = this.representShortcut = function (editorMethod) {
            var shortcut = invertedKeyMap[editorMethod];
            if (!options.shortcuts || !shortcut) {
                return '';
            }

            if (agent.isMac) {
                shortcut = shortcut.replace('CMD', '⌘').replace('SHIFT', '⇧');
            }

            shortcut = shortcut.replace('BACKSLASH', '\\')
            .replace('SLASH', '/')
            .replace('LEFTBRACKET', '[')
            .replace('RIGHTBRACKET', ']');

            return ' (' + shortcut + ')';
        };

        this.initialize = function () {
            this.addToolbarButtons();
            this.addImagePopoverButtons();
            this.addLinkPopoverButtons();
            this.addTablePopoverButtons();
            this.fontInstalledMap = {};
        };

        this.destroy = function () {
            delete this.fontInstalledMap;
        };

        this.isFontInstalled = function (name) {
            if (!self.fontInstalledMap.hasOwnProperty(name)) {
                self.fontInstalledMap[name] = agent.isFontInstalled(name) ||
                list.contains(options.fontNamesIgnoreCheck, name);
            }

            return self.fontInstalledMap[name];
        };

        this.addToolbarButtons = function () {
            context.memo('button.style', function () {
                return ui.buttonGroup([
                    ui.button({
                        className: 'dropdown-button',
                        contents: ui.icon('arrow_drop_down', 'left') + ui.icon('border_color'),
                        tooltip: lang.style.style,
                        data: {
                            activates: 'note-styles'
                        }
                    }),
                    ui.dropdown({
                        id: 'note-styles',
                        items: context.options.styleTags,
                        template: function (item) {

                            if (typeof item === 'string') {
                                item = { tag: item, title: (lang.style.hasOwnProperty(item) ? lang.style[item] : item) };
                            }

                            var tag = item.tag;
                            var title = item.title;
                            var style = item.style ? ' style="' + item.style + '" ' : '';
                            var className = item.className ? ' class="' + item.className + '"' : '';

                            return '<' + tag + style + className + '>' + title + '</' + tag +  '>';
                        },
                        click: context.createInvokeHandler('editor.formatBlock')
                    })
                ]).render();
            });

            context.memo('button.bold', function () {
                return ui.button({
                    className: 'note-btn-bold',
                    contents: ui.icon('format_bold'),
                    tooltip: lang.font.bold + representShortcut('bold'),
                    click: context.createInvokeHandlerAndUpdateState('editor.bold')
                }).render();
            });

            context.memo('button.italic', function () {
                return ui.button({
                    className: 'note-btn-italic',
                    contents: ui.icon('format_italic'),
                    tooltip: lang.font.italic + representShortcut('italic'),
                    click: context.createInvokeHandlerAndUpdateState('editor.italic')
                }).render();
            });

            context.memo('button.underline', function () {
                return ui.button({
                    className: 'note-btn-underline',
                    contents: ui.icon('format_underlined'),
                    tooltip: lang.font.underline + representShortcut('underline'),
                    click: context.createInvokeHandlerAndUpdateState('editor.underline')
                }).render();
            });

            context.memo('button.clear', function () {
                return ui.button({
                    contents: ui.icon('clear'),
                    tooltip: lang.font.clear + representShortcut('removeFormat'),
                    click: context.createInvokeHandler('editor.removeFormat')
                }).render();
            });

            context.memo('button.strikethrough', function () {
                return ui.button({
                    className: 'note-btn-strikethrough',
                    contents: ui.icon('strikethrough_s'),
                    tooltip: lang.font.strikethrough + representShortcut('strikethrough'),
                    click: context.createInvokeHandlerAndUpdateState('editor.strikethrough')
                }).render();
            });

            context.memo('button.superscript', function () {
                return ui.button({
                    className: 'note-btn-superscript',
                    contents: ui.icon('call_made'),
                    tooltip: lang.font.superscript,
                    click: context.createInvokeHandlerAndUpdateState('editor.superscript')
                }).render();
            });

            context.memo('button.subscript', function () {
                return ui.button({
                    className: 'note-btn-subscript',
                    contents: ui.icon('call_received'),
                    tooltip: lang.font.subscript,
                    click: context.createInvokeHandlerAndUpdateState('editor.subscript')
                }).render();
            });

            context.memo('button.fontname', function () {
                return ui.buttonGroup([
                    ui.button({
                        className: 'dropdown-button',
                        contents: ui.icon('arrow_drop_down', 'left') + '<span class="note-current-fontname"/>',
                        tooltip: lang.font.name,
                        data: {
                            activates: 'note-fonts'
                        }
                    }),
                    ui.dropdownCheck({
                        id: 'note-fonts',
                        className: 'dropdown-fontname',
                        checkClassName: 'done',
                        items: options.fontNames.filter(self.isFontInstalled),
                        template: function (item) {
                            return '<span style="font-family:' + item + '">' + item + '</span>';
                        },
                        click: context.createInvokeHandlerAndUpdateState('editor.fontName')
                    })
                ]).render();
            });

            context.memo('button.fontsize', function () {
                return ui.buttonGroup([
                    ui.button({
                        className: 'dropdown-button',
                        contents: ui.icon('arrow_drop_down', 'left') + '<span class="note-current-fontsize"/>',
                        tooltip: lang.font.size,
                        data: {
                            activates: 'note-sizes'
                        }
                    }),
                    ui.dropdownCheck({
                        id: 'note-sizes',
                        className: 'dropdown-fontsize',
                        checkClassName: 'done',
                        items: options.fontSizes,
                        click: context.createInvokeHandler('editor.fontSize')
                    })
                ]).render();
            });

            context.memo('button.color', function () {
                return ui.buttonGroup({
                    className: 'note-color',
                    children: [
                        ui.button({
                            className: 'note-current-color-button',
                            //contents: ui.icon('format_color_text'),
                            contents: '<div class="note-recent-color">A</div><div class="note-recent-color-back"></div>',
                            tooltip: lang.color.recent,
                            click: function (e) {
                                var $button = $(e.currentTarget);
                                context.invoke('editor.color', {
                                    backColor: $button.attr('data-backColor'),
                                    foreColor: $button.attr('data-foreColor')
                                });
                            },
                            callback: function ($button) {
                                let $recentColor = $button.find('.note-recent-color');
                                let $recentColorBack = $button.find('.note-recent-color-back');
                                let defaultColor = options.defaultColors.text;
                                let defaultBackColor = options.defaultColors.background;

                                $button.attr('data-backColor', defaultBackColor);
                                $button.attr('data-foreColor', defaultColor);
                                $recentColorBack.css('background-color', defaultBackColor);
                                $recentColor.css('color', defaultColor);
                            }
                        }),
                        ui.button({
                            className: 'dropdown-button',
                            contents: ui.icon('arrow_drop_down'),
                            tooltip: lang.color.more,
                            data: {
                                activates: 'note-colors'
                            },
                            click: function() {
                                let $dropdown = $(this).next('.dropdown-content');
                                let $tabs = $dropdown.find('ul.tabs');

                                // in this tabs initialization the indicator width will not be set since the plugin does not work
                                // with hidden elements (display: none);
                                // as a workaround the indicator width is forced to 50% in the css
                                $tabs.tabs({
                                    //swipeable: true
                                });
                            }
                        }),
                        ui.dropdown({
                            id: 'note-colors',
                            items: [
                                '<div class="row noMargins">',
                                    '<div class="col s12">',
                                        '<ul class="tabs">',
                                            '<li class="tab col s6"><a class="active" href="#note-background-color">' + lang.color.background + '</a></li>',
                                            '<li class="tab col s6"><a href="#note-foreground-color">' + lang.color.foreground + '</a></li>',
                                        '</ul>',
                                    '</div>',
                                '</div>',
                                '<div class="row noMargins">',
                                    '<div id="note-background-color" class="col s12">',
                                        '<div class="row noMargins">',
                                            '<div class="col s6">',
                                                '<button type="button" class="note-color-reset btn" data-event="backColor" data-value="inherit">' + lang.color.transparent + '</button>',
                                            '</div>',
                                            '<div class="col s6">',
                                                '<span class="color-name"></span>',
                                            '</div>',
                                        '</div>',
                                        '<div class="note-holder" data-event="backColor"></div>',
                                    '</div>',
                                    '<div id="note-foreground-color" class="col s12">',
                                        '<div class="row noMargins">',
                                            '<div class="col s6">',
                                                '<button type="button" class="note-color-reset btn" data-event="removeFormat" data-value="foreColor">' + lang.color.resetToDefault + '</button>',
                                            '</div>',
                                            '<div class="col s6">',
                                                '<span class="color-name"></span>',
                                            '</div>',
                                        '</div>',
                                        '<div class="note-holder" data-event="foreColor"/></div>',
                                    '</div>',
                                '</div>'
                            ].join(''),
                            callback: function ($dropdown) {
                                $dropdown.find('.note-holder').each(function () {
                                    var $holder = $(this);

                                    $holder.append(ui.palette({
                                        colors: options.colors,
                                        colorNames: options.colorNames,
                                        eventName: $holder.data('event'),
                                    }).render());
                                });
                            },
                            click: function (event) {
                                var $button = $(event.target);
                                var eventName = $button.data('event');
                                var value = $button.data('value');

                                // prevent closing dropdown when clicking other than note-color-btn or note-color-reset
                                if (!$button.hasClass('note-color-btn') && !$button.hasClass('note-color-reset')) {
                                    return false;
                                }

                                if (eventName && value) {
                                    let key = eventName === 'backColor' ? 'background-color' : 'color';
                                    let $currentButton = $button.closest('.note-color').find('.note-current-color-button');

                                    if (key === 'background-color') {
                                        let $recentColorBack = $button.closest('.note-color').find('.note-recent-color-back');

                                        $recentColorBack.css('background-color', value);
                                    }
                                    else {
                                        let $recentColor = $button.closest('.note-color').find('.note-recent-color');

                                        $recentColor.css('color', value);
                                    }
                                    $currentButton.attr('data-' + eventName, value);
                                    context.invoke('editor.' + eventName, value);
                                }
                            }
                        })
                    ]
                }).render();
            });

            context.memo('button.ul',  function () {
                return ui.button({
                    contents: ui.icon('format_list_bulleted'),
                    tooltip: lang.lists.unordered + representShortcut('insertUnorderedList'),
                    click: context.createInvokeHandler('editor.insertUnorderedList')
                }).render();
            });

            context.memo('button.ol', function () {
                return ui.button({
                    contents: ui.icon('format_list_numbered'),
                    tooltip: lang.lists.ordered + representShortcut('insertOrderedList'),
                    click:  context.createInvokeHandler('editor.insertOrderedList')
                }).render();
            });

            var justifyLeft = ui.button({
                contents: ui.icon('format_align_left'),
                tooltip: lang.paragraph.left + representShortcut('justifyLeft'),
                click: context.createInvokeHandler('editor.justifyLeft')
            });

            var justifyCenter = ui.button({
                contents: ui.icon('format_align_center'),
                tooltip: lang.paragraph.center + representShortcut('justifyCenter'),
                click: context.createInvokeHandler('editor.justifyCenter')
            });

            var justifyRight = ui.button({
                contents: ui.icon('format_align_right'),
                tooltip: lang.paragraph.right + representShortcut('justifyRight'),
                click: context.createInvokeHandler('editor.justifyRight')
            });

            var justifyFull = ui.button({
                contents: ui.icon('format_align_justify'),
                tooltip: lang.paragraph.justify + representShortcut('justifyFull'),
                click: context.createInvokeHandler('editor.justifyFull')
            });

            var outdent = ui.button({
                contents: ui.icon('format_indent_decrease'),
                tooltip: lang.paragraph.outdent + representShortcut('outdent'),
                click: context.createInvokeHandler('editor.outdent')
            });

            var indent = ui.button({
                contents: ui.icon('format_indent_increase'),
                tooltip: lang.paragraph.indent + representShortcut('indent'),
                click: context.createInvokeHandler('editor.indent')
            });

            context.memo('button.paragraphAlignLeft', function() {
                return justifyLeft.render();
            });
            context.memo('button.paragraphAlignRight', function() {
                return justifyRight.render();
            });
            context.memo('button.paragraphAlignCenter', function() {
                return justifyCenter.render();
            });
            context.memo('button.paragraphAlignFull', function() {
                return justifyFull.render();
            });
            context.memo('button.paragraphOutdent', function() {
                return outdent.render();
            });
            context.memo('button.paragraphIndent', function() {
                return indent.render();
            });

            context.memo('button.justifyLeft', func.invoke(justifyLeft, 'render'));
            context.memo('button.justifyCenter', func.invoke(justifyCenter, 'render'));
            context.memo('button.justifyRight', func.invoke(justifyRight, 'render'));
            context.memo('button.justifyFull', func.invoke(justifyFull, 'render'));
            context.memo('button.outdent', func.invoke(outdent, 'render'));
            context.memo('button.indent', func.invoke(indent, 'render'));

            context.memo('button.paragraph', function () {
                return ui.buttonGroup([
                    ui.button({
                        className: 'dropdown-button',
                        contents: ui.icon('arrow_drop_down', 'left') + ui.icon('format_textdirection_l_to_r'),
                        tooltip: lang.paragraph.paragraph,
                        data: {
                            activates: 'note-paragraph'
                        }
                    }),
                    ui.dropdown([
                        ui.buttonGroup({
                            className: 'note-align',
                            children: [justifyLeft, justifyCenter, justifyRight, justifyFull]
                        }),
                        ui.buttonGroup({
                            className: 'note-list',
                            children: [outdent, indent]
                        })
                    ], {id: 'note-paragraph'})
                ]).render();
            });

            context.memo('button.height', function () {
                return ui.buttonGroup([
                    ui.button({
                        className: 'dropdown-button',
                        contents: ui.icon('arrow_drop_down', 'left') + ' ' + ui.icon('format_size'),
                        tooltip: lang.font.height,
                        data: {
                            activates: 'note-height'
                        }
                    }),
                    ui.dropdownCheck({
                        id: 'note-height',
                        items: options.lineHeights,
                        checkClassName: 'done',
                        className: 'dropdown-line-height',
                        click: context.createInvokeHandler('editor.lineHeight')
                    })
                ]).render();
            });

            context.memo('button.table', function () {
                return ui.buttonGroup([
                    ui.button({
                        className: 'dropdown-button',
                        contents: ui.icon('arrow_drop_down', 'left') + ' ' + ui.icon('border_all'),
                        tooltip: lang.table.table,
                        data: {
                            activates: 'note-table'
                        }
                    }),
                    ui.dropdown({
                        id: 'note-table',
                        className: 'note-table',
                        items: [
                            '<div class="row beforePicker">',
                                '<div class="col s12 m6">',
                                    '<input type="checkbox" id="note-table-bordered" class="note-table-option" />',
                                    '<label class="note-table-option" for="note-table-bordered">' + lang.table.bordered + '</label>',
                                '</div>',
                                '<div class="col s12 m6">',
                                    '<input type="checkbox" id="note-table-striped" class="note-table-option" checked="checked" />',
                                    '<label class="note-table-option" for="note-table-striped">' + lang.table.striped + '</label>',
                                '</div>',
                                '<div class="col s12 m6">',
                                    '<input type="checkbox" id="note-table-highlight" class="note-table-option" checked="checked" />',
                                    '<label class="note-table-option" for="note-table-highlight">' + lang.table.highlight + '</label>',
                                '</div>',
                                '<div class="col s12 m6">',
                                    '<input type="checkbox" id="note-table-responsive" class="note-table-option" checked="checked" />',
                                    '<label class="note-table-option" for="note-table-responsive">' + lang.table.responsive + '</label>',
                                '</div>',
                                '<div class="col s12 m6">',
                                    '<input type="checkbox" id="note-table-centered" class="note-table-option" />',
                                    '<label class="note-table-option" for="note-table-centered">' + lang.table.centered + '</label>',
                                '</div>',
                            '</div>',
                            '<div class="row">',
                                '<div class="col s12">',
                                    '<div class="note-dimension-picker">',
                                        '<div class="note-dimension-picker-mousecatcher" data-event="insertTable" data-value="1x1"/>',
                                        '<div class="note-dimension-picker-highlighted"/>',
                                        '<div class="note-dimension-picker-unhighlighted"/>',
                                    '</div>',
                                '</div>',
                            '</div>',
                            '<div class="row">',
                                '<div class="col s12">',
                                    '<div class="note-dimension-display">1 x 1</div>',
                                '</div>',
                            '</div>'
                        ].join(''),
                        click: function (event) {
                            var $button = $(event.target);

                            // prevent closing dropdown when clicking table option checkboxes
                            if ($button.hasClass('note-table-option')) {
                                event.stopPropagation();
                            }
                        }
                    })
                ], {
                    callback: function ($node) {
                        var $catcher = $node.find('.note-dimension-picker-mousecatcher');

                        $catcher.css({
                            width: options.insertTableMaxSize.col * 26 + 'px',
                            height: options.insertTableMaxSize.row * 26 + 'px'
                        }).mousedown(context.createInvokeHandler('editor.insertTable'))
                        .on('mousemove', self.tableMoveHandler);
                    }
                }).render();
            });

            context.memo('button.link', function () {
                return ui.button({
                    contents: ui.icon('insert_link'),
                    tooltip: lang.link.link + representShortcut('linkDialog.show'),
                    click: context.createInvokeHandler('linkDialog.show')
                }).render();
            });

            context.memo('button.picture', function () {
                return ui.button({
                    contents: ui.icon('image'),
                    tooltip: lang.image.image,
                    click: context.createInvokeHandler('imageDialog.show')
                }).render();
            });

            context.memo('button.video', function () {
                return ui.button({
                    contents: ui.icon('videocam'),
                    tooltip: lang.video.video,
                    click: context.createInvokeHandler('videoDialog.show')
                }).render();
            });

            context.memo('button.hr', function () {
                return ui.button({
                    contents: ui.icon('remove'),
                    tooltip: lang.hr.insert + representShortcut('insertHorizontalRule'),
                    click: context.createInvokeHandler('editor.insertHorizontalRule')
                }).render();
            });


            // materialize's components
            // cards
            context.memo('button.materializeCard', function () {
                return ui.button({
                    contents: ui.icon('view_agenda'),
                    tooltip: lang.materializeComponents.card,
                    click: context.createInvokeHandler('cardDialog.show')
                }).render();
            });
            /*context.memo('button.materializeCard', function () {
                return ui.buttonGroup({
                    className: 'note-card',
                    children: [
                        ui.button({
                            className: 'note-card-current',
                            contents: ui.icon('view_agenda'),
                            //contents: '<div class="note-recent-color">A</div><div class="note-recent-color-back"></div>',
                            tooltip: lang.materializeComponents.card,
                            click: function() {
                                context.invoke('editor.insertCard', $(this).attr('data-backcolor'), $(this).attr('data-forecolor'));
                            },
                            callback: function ($button) {
                                let $recentColor = $button.find('.note-recent-color');
                                let $recentColorBack = $button.find('.note-recent-color-back');
                                let defaultColor = options.defaultColors.text;
                                let defaultBackColor = options.defaultColors.background;

                                $button.attr('data-backColor', options.defaultColors.cardBackground);
                                $button.attr('data-foreColor', ui.colors.backNameToText(options.defaultColors.cardText));
                                $recentColorBack.css('background-color', defaultBackColor);
                                $recentColor.css('color', defaultColor);
                            }
                        }),
                        ui.button({
                            className: 'dropdown-button',
                            contents: ui.icon('arrow_drop_down'),
                            tooltip: lang.color.more,
                            data: {
                                activates: 'note-card-colors'
                            },
                            click: function() {
                                let $dropdown = $(this).next('.dropdown-content');
                                let $tabs = $dropdown.find('ul.tabs');

                                // in this tabs initialization the indicator width will not be set since the plugin does not work
                                // with hidden elements (display: none);
                                // as a workaround the indicator width is forced to 50% in the css
                                $tabs.tabs({
                                    //swipeable: true
                                });
                            }
                        }),
                        ui.dropdown({
                            id: 'note-card-colors',
                            items: [
                                '<div class="row noMargins">',
                                    '<div class="col s12">',
                                        '<ul class="tabs">',
                                            '<li class="tab col s6"><a class="active" href="#note-card-background-color">' + lang.color.background + '</a></li>',
                                            '<li class="tab col s6"><a href="#note-card-foreground-color">' + lang.color.foreground + '</a></li>',
                                        '</ul>',
                                    '</div>',
                                '</div>',
                                '<div class="row noMargins">',
                                    '<div id="note-card-background-color" class="col s12">',
                                        '<div class="row noMargins">',
                                            '<div class="col s6">',
                                                '<div class="color-name"></div>',
                                            '</div>',
                                        '</div>',
                                        '<div class="note-holder" data-event="cardBackColor"></div>',
                                    '</div>',
                                    '<div id="note-card-foreground-color" class="col s12">',
                                        '<div class="row noMargins">',
                                            '<div class="col s6">',
                                                '<div class="color-name"></div>',
                                            '</div>',
                                        '</div>',
                                        '<div class="note-holder" data-event="cardForeColor"/></div>',
                                    '</div>',
                                '</div>'
                            ].join(''),
                            callback: function ($dropdown) {
                                $dropdown.find('.note-holder').each(function () {
                                    var $holder = $(this);

                                    $holder.append(ui.palette({
                                        colors: options.colors,
                                        colorNames: options.colorNames,
                                        eventName: $holder.data('event'),
                                    }).render());
                                });
                            },
                            click: function (event) {
                                let $button = $(event.target);
                                let eventName = $button.data('event');
                                let value = $button.data('value');

                                // prevent closing dropdown when clicking other than note-color-btn or note-color-reset
                                if (!$button.hasClass('note-color-btn') && !$button.hasClass('note-color-reset')) {
                                    return false;
                                }

                                if (eventName && value) {
                                    let colorName = $button.data('description');
                                    let $recentCardColor = $button.closest('#note-card-colors').siblings('.note-card-current');

                                    if (eventName === 'cardBackColor') {
                                        $recentCardColor.attr('data-backcolor', colorName);
                                    }
                                    else {
                                        $recentCardColor.attr('data-forecolor', ui.colors.backNameToText(colorName));
                                    }
                                }
                            }
                        })
                    ]
                }).render();
            });*/


            context.memo('button.fullscreen', function () {
                return ui.button({
                    className: 'btn-fullscreen',
                    contents: ui.icon('settings_overscan'),
                    tooltip: lang.options.fullscreen,
                    click: context.createInvokeHandler('fullscreen.toggle')
                }).render();
            });

            context.memo('button.codeview', function () {
                return ui.button({
                    className: 'btn-codeview',
                    contents: ui.icon('code'),
                    tooltip: lang.options.codeview,
                    click: context.createInvokeHandler('codeview.toggle')
                }).render();
            });

            context.memo('button.redo', function () {
                return ui.button({
                    contents: ui.icon('redo'),
                    tooltip: lang.history.redo + representShortcut('redo'),
                    click: context.createInvokeHandler('editor.redo')
                }).render();
            });

            context.memo('button.undo', function () {
                return ui.button({
                    contents: ui.icon('undo'),
                    tooltip: lang.history.undo + representShortcut('undo'),
                    click: context.createInvokeHandler('editor.undo')
                }).render();
            });

            context.memo('button.help', function () {
                return ui.button({
                    contents: ui.icon('help'),
                    tooltip: lang.options.help,
                    click: context.createInvokeHandler('helpDialog.show')
                }).render();
            });
        };

        /**
        * image : [
        *   ['imagesize', ['imageSize100', 'imageSize50', 'imageSize25']],
        *   ['float', ['floatLeft', 'floatRight', 'floatNone' ]],
        *   ['remove', ['removeMedia']]
        * ],
        */
        this.addImagePopoverButtons = function () {
            // Image Size Buttons
            context.memo('button.imageSize100', function () {
                return ui.button({
                    contents: '<span class="note-fontsize-10">100%</span>',
                    id: 'note-image-size-100',
                    tooltip: lang.image.resizeFull,
                    click: context.createInvokeHandler('editor.resize', '1')
                }).render();
            });
            context.memo('button.imageSize50', function () {
                return  ui.button({
                    contents: '<span class="note-fontsize-10">50%</span>',
                    id: 'note-image-size-50',
                    tooltip: lang.image.resizeHalf,
                    click: context.createInvokeHandler('editor.resize', '0.5')
                }).render();
            });
            context.memo('button.imageSize25', function () {
                return ui.button({
                    contents: '<span class="note-fontsize-10">25%</span>',
                    id: 'note-image-size-25',
                    tooltip: lang.image.resizeQuarter,
                    click: context.createInvokeHandler('editor.resize', '0.25')
                }).render();
            });

            // Float Buttons
            context.memo('button.floatLeft', function () {
                return ui.button({
                    contents: ui.icon('format_align_left'),
                    id: 'note-image-float-left',
                    tooltip: lang.image.floatLeft,
                    click: context.createInvokeHandler('editor.floatMe', 'left')
                }).render();
            });

            context.memo('button.floatRight', function () {
                return ui.button({
                    contents: ui.icon('format_align_right'),
                    id: 'note-image-float-right',
                    tooltip: lang.image.floatRight,
                    click: context.createInvokeHandler('editor.floatMe', 'right')
                }).render();
            });

            context.memo('button.floatNone', function () {
                return ui.button({
                    contents: ui.icon('format_align_justify'),
                    id: 'note-image-float-none',
                    tooltip: lang.image.floatNone,
                    click: context.createInvokeHandler('editor.floatMe', 'none')
                }).render();
            });

            // responsive button
            context.memo('button.responsive', function() {
                return ui.button({
                    contents: ui.icon('photo_size_select_large'),
                    id: 'note-image-responsive',
                    tooltip: lang.image.responsive,
                    click: context.createInvokeHandler('editor.responsivize')
                }).render();
            });

            // Remove Buttons
            context.memo('button.removeMedia', function () {
                return ui.button({
                    contents: ui.icon('delete_forever'),
                    tooltip: lang.image.remove,
                    click: context.createInvokeHandler('editor.removeMedia')
                }).render();
            });
        };

        this.addLinkPopoverButtons = function () {
            context.memo('button.linkDialogShow', function () {
                return ui.button({
                    contents: ui.icon('link'),
                    tooltip: lang.link.edit,
                    click: context.createInvokeHandler('linkDialog.show')
                }).render();
            });

            // button open in new window
            context.memo('button.openLinkNewWindow', function () {
                return ui.button({
                    contents: ui.icon('open_in_new'),
                    id: 'note-link-open-new-window',
                    tooltip: lang.link.openInNewWindow,
                    click: context.createInvokeHandler('editor.toggleOpenInNewWindow')
                }).render();
            });

            context.memo('button.unlink', function () {
                return ui.button({
                    contents: ui.icon('clear'),
                    tooltip: lang.link.unlink,
                    click: context.createInvokeHandler('editor.unlink')
                }).render();
            });
        };

        /**
        * table : [
        *  ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
        *  ['delete', ['deleteRow', 'deleteCol', 'deleteTable']]
        * ],
        */
        this.addTablePopoverButtons = function () {
            context.memo('button.addRowUp', function () {
                return ui.button({
                    className: 'btn-md',
                    contents: ui.icon('expand_less'),
                    tooltip: lang.table.addRowAbove,
                    click: context.createInvokeHandler('editor.addRow', 'top')
                }).render();
            });
            context.memo('button.addRowDown', function () {
                return ui.button({
                    className: 'btn-md',
                    contents: ui.icon('expand_more'),
                    tooltip: lang.table.addRowBelow,
                    click: context.createInvokeHandler('editor.addRow', 'bottom')
                }).render();
            });
            context.memo('button.addColLeft', function () {
                return ui.button({
                    className: 'btn-md',
                    contents: ui.icon('chevron_left'),
                    tooltip: lang.table.addColLeft,
                    click: context.createInvokeHandler('editor.addCol', 'left')
                }).render();
            });
            context.memo('button.addColRight', function () {
                return ui.button({
                    className: 'btn-md',
                    contents: ui.icon('chevron_right'),
                    tooltip: lang.table.addColRight,
                    click: context.createInvokeHandler('editor.addCol', 'right')
                }).render();
            });
            context.memo('button.deleteRow', function () {
                return ui.button({
                    className: 'btn-md',
                    contents: ui.icon('border_horizontal'),
                    tooltip: lang.table.delRow,
                    click: context.createInvokeHandler('editor.deleteRow')
                }).render();
            });
            context.memo('button.deleteCol', function () {
                return ui.button({
                    className: 'btn-md',
                    contents: ui.icon('border_vertical'),
                    tooltip: lang.table.delCol,
                    click: context.createInvokeHandler('editor.deleteCol')
                }).render();
            });
            context.memo('button.deleteTable', function () {
                return ui.button({
                    className: 'btn-md',
                    contents: ui.icon('clear'),
                    tooltip: lang.table.delTable,
                    click: context.createInvokeHandler('editor.deleteTable')
                }).render();
            });

            // materialize's table options
            context.memo('button.borderedTable', function () {
                return ui.button({
                    className: 'btn-md',
                    id: 'note-table-bordered',
                    contents: ui.icon('border_outer'),
                    tooltip: lang.table.bordered,
                    click: context.createInvokeHandler('editor.updateTable', 'bordered')
                }).render();
            });
            context.memo('button.stripedTable', function () {
                return ui.button({
                    className: 'btn-md',
                    id: 'note-table-striped',
                    contents: ui.icon('view_headline'),
                    tooltip: lang.table.striped,
                    click: context.createInvokeHandler('editor.updateTable', 'striped')
                }).render();
            });
            context.memo('button.highlightedTable', function () {
                return ui.button({
                    className: 'btn-md',
                    id: 'note-table-highlighted',
                    contents: ui.icon('highlight'),
                    tooltip: lang.table.highlight,
                    click: context.createInvokeHandler('editor.updateTable', 'highlight')
                }).render();
            });
            context.memo('button.responsiveTable', function () {
                return ui.button({
                    className: 'btn-md',
                    id: 'note-table-responsive',
                    contents: ui.icon('crop_free'),
                    tooltip: lang.table.responsive,
                    click: context.createInvokeHandler('editor.updateTable', 'responsive-table')
                }).render();
            });
            context.memo('button.centeredTable', function () {
                return ui.button({
                    className: 'btn-md',
                    id: 'note-table-centered',
                    contents: ui.icon('format_align_center'),
                    tooltip: lang.table.centered,
                    click: context.createInvokeHandler('editor.updateTable', 'centered')
                }).render();
            });
        };

        this.build = function ($container, groups) {
            for (var groupIdx = 0, groupLen = groups.length; groupIdx < groupLen; groupIdx++) {
                var group = groups[groupIdx];
                var groupName = group[0];
                var buttons = group[1];

                var $group = ui.buttonGroup({
                    className: 'note-' + groupName
                }).render();

                for (var idx = 0, len = buttons.length; idx < len; idx++) {
                    var button = context.memo('button.' + buttons[idx]);
                    if (button) {
                        $group.append(typeof button === 'function' ? button(context) : button);
                    }
                }
                $group.appendTo($container);
            }
        };

        this.updateCurrentStyle = function () {
            var styleInfo = context.invoke('editor.currentStyle');
            this.updateBtnStates({
                '.note-btn-bold': function () {
                    return styleInfo['font-bold'] === 'bold';
                },
                '.note-btn-italic': function () {
                    return styleInfo['font-italic'] === 'italic';
                },
                '.note-btn-underline': function () {
                    return styleInfo['font-underline'] === 'underline';
                },
                '.note-btn-subscript': function () {
                    return styleInfo['font-subscript'] === 'subscript';
                },
                '.note-btn-superscript': function () {
                    return styleInfo['font-superscript'] === 'superscript';
                },
                '.note-btn-strikethrough': function () {
                    return styleInfo['font-strikethrough'] === 'strikethrough';
                }
            });

            if (styleInfo['font-family']) {
                var fontNames = styleInfo['font-family'].split(',').map(function (name) {
                    return name.replace(/[\'\"]/g, '')
                    .replace(/\s+$/, '')
                    .replace(/^\s+/, '');
                });
                var fontName = list.find(fontNames, self.isFontInstalled);

                $toolbar.find('.dropdown-fontname li a').each(function () {
                    // always compare string to avoid creating another func.
                    var isChecked = ($(this).data('value') + '') === (fontName + '');

                    this.className = isChecked ? 'checked' : '';
                });
                $toolbar.find('.note-current-fontname').text(fontName);
            }

            if (styleInfo['font-size']) {
                var fontSize = styleInfo['font-size'];
                $toolbar.find('.dropdown-fontsize li a').each(function () {
                    // always compare with string to avoid creating another func.
                    var isChecked = ($(this).data('value') + '') === (fontSize + '');
                    this.className = isChecked ? 'checked' : '';
                });
                $toolbar.find('.note-current-fontsize').text(fontSize);
            }

            if (styleInfo['line-height']) {
                var lineHeight = styleInfo['line-height'];
                $toolbar.find('.dropdown-line-height li a').each(function () {
                    // always compare with string to avoid creating another func.
                    var isChecked = ($(this).data('value') + '') === (lineHeight + '');
                    this.className = isChecked ? 'checked' : '';
                });
            }
        };

        this.updateBtnStates = function (infos) {
            $.each(infos, function (selector, pred) {
                ui.toggleBtnActive($toolbar.find(selector), pred());
            });
        };

        this.tableMoveHandler = function (event) {
            var $picker = $(event.target.parentNode); // target is mousecatcher
            var $dimensionDisplay = $picker.closest('.row').next('.row').find('.note-dimension-display');
            var $catcher = $picker.find('.note-dimension-picker-mousecatcher');
            var $highlighted = $picker.find('.note-dimension-picker-highlighted');
            var $unhighlighted = $picker.find('.note-dimension-picker-unhighlighted');

            var posOffset;
            // HTML5 with jQuery - e.offsetX is undefined in Firefox
            if (event.offsetX === undefined) {
                var posCatcher = $(event.target).offset();
                posOffset = {
                    x: event.pageX - posCatcher.left,
                    y: event.pageY - posCatcher.top
                };
            } else {
                posOffset = {
                    x: event.offsetX,
                    y: event.offsetY
                };
            }

            var dim = {
                c: Math.ceil(posOffset.x / 26) || 1,
                r: Math.ceil(posOffset.y / 26) || 1
            };

            $highlighted.css({ width: dim.c * 26 + 'px', height: dim.r * 26 + 'px' });
            $catcher.data('value', dim.c + 'x' + dim.r);

            if (3 < dim.r && dim.r < options.insertTableMaxSize.row) {
                $unhighlighted.css({ height: (dim.r + 1) * 26 + 'px'});
            }

            $dimensionDisplay.html(dim.c + ' x ' + dim.r);
        };
    };

    var Toolbar = function (context) {
        var ui = $.materialnote.ui;
        var $editor = context.layoutInfo.editor;
        var $note = context.layoutInfo.note;
        let $toolbar = context.layoutInfo.toolbar;
        var options = context.options;

        this.shouldInitialize = function () {
            return !options.airMode;
        };

        // following toolbar
        this.followingToolbar = function() {
            let isFullscreen = $editor.hasClass('fullscreen');

            if (isFullscreen) {
              return false;
            }

            let $toolbarWrapper = $toolbar.parent('.note-toolbar-wrapper');
            let editorHeight = $editor.outerHeight();
            let editorWidth = $editor.width();
            let toolbarOffset, editorOffsetTop, editorOffsetBottom, toolbarHeight;
            let activateOffset, deactivateOffsetTop, deactivateOffsetBottom;
            let currentOffset;
            let otherBarHeight;

            toolbarHeight = $toolbar.height();
            $toolbarWrapper.css({height: toolbarHeight});

            // check if the web app is currently using another static bar
            otherBarHeight = $('.' + options.otherStaticBarClass).outerHeight();
            if (!otherBarHeight) {
                otherBarHeight = 0;
            }

            currentOffset = $(document).scrollTop();
            toolbarOffset = $toolbar.offset().top;
            editorOffsetTop = $editor.offset().top;
            editorOffsetBottom = editorOffsetTop + editorHeight;
            activateOffset = editorOffsetTop - otherBarHeight;
            deactivateOffsetBottom = editorOffsetBottom - otherBarHeight - toolbarHeight;
            deactivateOffsetTop = editorOffsetTop - otherBarHeight;

            if ((currentOffset > activateOffset) && (currentOffset < deactivateOffsetBottom)) {
                $toolbar.css({position: 'fixed', top: otherBarHeight, width: editorWidth});
            } else {
                $toolbar.css({position: 'relative', top: 0, width: '100%'});
            }
        };

        this.initialize = function () {
            options.toolbar = options.toolbar || [];

            if (!options.toolbar.length) {
                $toolbar.hide();
            } else {
                context.invoke('buttons.build', $toolbar, options.toolbar);
            }

            if (options.toolbarContainer) {
                $toolbar.appendTo(options.toolbarContainer);
            }

            $note.on('materialnote.keyup materialnote.mouseup materialnote.change', function () {
                context.invoke('buttons.updateCurrentStyle');
            });

            context.invoke('buttons.updateCurrentStyle');

            if (options.followingToolbar) {
                $(window).on('scroll resize', () => {
                    this.followingToolbar();
                });
            }
        };

        this.destroy = function () {
            $(window).off('scroll resize', this.followingToolbar);
            $toolbar.children().remove();
        };

        this.updateFullscreen = function (isFullscreen) {
            ui.toggleBtnActive($toolbar.find('.btn-fullscreen'), isFullscreen);
        };

        this.updateCodeview = function (isCodeview) {
            ui.toggleBtnActive($toolbar.find('.btn-codeview'), isCodeview);
            if (isCodeview) {
                this.deactivate();
            } else {
                this.activate();
            }
        };

        this.activate = function (isIncludeCodeview) {
            var $btn = $toolbar.find('div.note-btn');
            if (!isIncludeCodeview) {
                $btn = $btn.not('.btn-codeview');
            }
            ui.toggleBtn($btn, true);
            $toolbar.removeClass('disabled');
        };

        this.deactivate = function (isIncludeCodeview) {
            var $btn = $toolbar.find('div.note-btn');
            if (!isIncludeCodeview) {
                $btn = $btn.not('.btn-codeview');
            }
            ui.toggleBtn($btn, false);
            $toolbar.addClass('disabled');
        };
    };

    var LinkDialog = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var $editor = context.layoutInfo.editor;
        var options = context.options;
        var lang = options.langInfo;
        var data;
        var linkInfo;

        this.initialize = function () {
            var $container = options.dialogsInBody ? $(document.body) : $editor;

            var body =
            '<div class="row">' +
                '<div class="input-field col s12">' +
                    '<input id="note-link-text" class="note-link-text" type="text">' +
                    '<label for="note-link-text">' + lang.link.textToDisplay + '</label>' +
                '</div>' +
            '</div>' +

            '<div class="row">' +
                '<div class="input-field col s12">' +
                    '<input id="note-link-url" class="note-link-url" type="text">' +
                    '<label for="note-link-url">' + lang.link.url + '</label>' +
                '</div>' +

                (!options.disableLinkTarget ?
                    '<div class="col s12">' +
                        '<input type="checkbox" id="sn-checkbox-open-in-new-window" />' +
                        '<label for="sn-checkbox-open-in-new-window">' + lang.link.openInNewWindow + '</label>' +
                    '</div>' : ''
                ) +

            '</div>';

            var footer = [
                '<a href="#!" class="modal-action modal-close waves-effect waves-light btn ">' + lang.shortcut.close + '</a>',
                '<button href="#" class="btn note-link-btn disabled" disabled>' + lang.link.insert + '</button>'
            ].join('');

            this.$dialog = ui.dialog({
                title: lang.link.insert,
                body: body,
                footer: footer,
                id: 'note-link-modal'
            }).render().appendTo($container);

            this.$dialog.modal({
                ready: function() {
                    var $linkText = self.$dialog.find('.note-link-text'),
                    $linkUrl = self.$dialog.find('.note-link-url'),
                    $linkBtn = self.$dialog.find('.note-link-btn'),
                    $openInNewWindow = self.$dialog.find('input[type=checkbox]');

                    context.triggerEvent('dialog.shown');

                    // if no url was given, copy text to url
                    if (!linkInfo.url) {
                        linkInfo.url = linkInfo.text;
                    }

                    // handle materialize's label state
                    if (linkInfo.text !== '') {
                        $linkText.next('label').addClass('active');
                    }
                    else {
                        $linkText.next('label').removeClass('active');
                    }
                    $linkText.val(linkInfo.text);

                    var handleLinkTextUpdate = function () {
                        self.toggleLinkBtn($linkBtn, $linkText, $linkUrl);
                        // if linktext was modified by keyup,
                        // stop cloning text from linkUrl
                        linkInfo.text = $linkText.val();
                    };

                    $linkText.on('input', handleLinkTextUpdate).on('paste', function () {
                        setTimeout(handleLinkTextUpdate, 0);
                    });

                    var handleLinkUrlUpdate = function () {
                        self.toggleLinkBtn($linkBtn, $linkText, $linkUrl);
                        // display same link on `Text to display` input
                        // when create a new link
                        if (!linkInfo.text) {
                            $linkText.val($linkUrl.val());
                        }
                    };

                    $linkUrl.on('input', handleLinkUrlUpdate).on('paste', function () {
                        setTimeout(handleLinkUrlUpdate, 0);
                    }).val(linkInfo.url).trigger('focus');

                    self.toggleLinkBtn($linkBtn, $linkText, $linkUrl);
                    self.bindEnterKey($linkUrl, $linkBtn);
                    self.bindEnterKey($linkText, $linkBtn);

                    var isChecked = linkInfo.isNewWindow !== undefined ?
                    linkInfo.isNewWindow : context.options.linkTargetBlank;

                    $openInNewWindow.prop('checked', isChecked);

                    $linkBtn.one('click', function(event) {
                        event.preventDefault();

                        data.resolve({
                            range: linkInfo.range,
                            url: $linkUrl.val(),
                            text: $linkText.val(),
                            isNewWindow: $openInNewWindow.is(':checked')
                        });
                        self.$dialog.modal('close');
                    });
                },
                complete: function() {
                    var $linkText = self.$dialog.find('.note-link-text'),
                    $linkUrl = self.$dialog.find('.note-link-url'),
                    $linkBtn = self.$dialog.find('.note-link-btn');

                    // detach events
                    $linkText.off('input paste keypress');
                    $linkUrl.off('input paste keypress');
                    $linkBtn.off('click');

                    if (data.state() === 'pending') {
                        data.reject();
                    }
                }
            });
        };

        this.destroy = function () {
            ui.hideDialog(this.$dialog);
            this.$dialog.remove();
        };

        this.bindEnterKey = function ($input, $btn) {
            $input.on('keypress', function (event) {
                if (event.keyCode === key.code.ENTER) {
                    $btn.trigger('click');
                }
            });
        };

        /**
        * toggle update button
        */
        this.toggleLinkBtn = function ($linkBtn, $linkText, $linkUrl) {
            ui.toggleBtn($linkBtn, $linkText.val() && $linkUrl.val());
        };

        /**
        * @param {Object} layoutInfo
        */
        this.show = function () {
            linkInfo = context.invoke('editor.getLinkInfo');

            context.invoke('editor.saveRange');
            ui.showDialog(self.$dialog);
            data = $.Deferred();

            data.then(function(linkInfo) {
                context.invoke('editor.restoreRange');
                context.invoke('editor.createLink', linkInfo);
            }).fail(function() {
                context.invoke('editor.restoreRange');
            });
        };
        context.memo('help.linkDialog.show', options.langInfo.help['linkDialog.show']);
    };

    var LinkPopover = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var options = context.options;

        this.events = {
            'materialnote.keyup materialnote.mouseup materialnote.change': function () {
                self.update();
            },
            'materialnote.disable materialnote.dialog.shown materialnote.scroll': function () {
                self.hide();
            }
        };

        this.shouldInitialize = function () {
            return !list.isEmpty(options.popover.link);
        };

        this.initialize = function () {
            this.$popover = ui.popover({
                className: 'note-link-popover',
                callback: function ($node) {
                    var $content = $node.find('.popover-content');
                    $content.prepend('<span class="popover-link"><a target="_blank"></a>&nbsp;</span>');
                }
            }).render().appendTo('body');
            var $content = this.$popover.find('.popover-content');

            context.invoke('buttons.build', $content, options.popover.link);
        };

        this.destroy = function () {
            this.$popover.remove();
        };

        this.update = function () {
            // Prevent focusing on editable when invoke('code') is executed
            if (!context.invoke('editor.hasFocus')) {
                this.hide();
                return;
            }

            var rng = context.invoke('editor.createRange');
            if (rng.isCollapsed() && rng.isOnAnchor()) {
                var anchor = dom.ancestor(rng.sc, dom.isAnchor);
                var href = $(anchor).attr('href');
                this.$popover.find('a').attr('href', href).html(href);

                var pos = dom.posFromPlaceholder(anchor);
                let linkInfo = context.invoke('editor.getLinkInfo');

                // handle buttons active status
                // open in new window
                this.$popover.find('.btn-group.note-link').children('.note-btn').removeClass('active');
                if (linkInfo.isNewWindow) {
                    this.$popover.find('#note-link-open-new-window').addClass('active');
                }

                this.$popover.css({
                    display: 'block',
                    left: pos.left,
                    top: pos.top
                });
            } else {
                this.hide();
            }
        };

        this.hide = function () {
            this.$popover.hide();
        };
    };

    var ImageDialog = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var $editor = context.layoutInfo.editor;
        var options = context.options;
        var lang = options.langInfo;
        var data;

        this.initialize = function () {
            var $container = options.dialogsInBody ? $(document.body) : $editor;

            var imageLimitation = '';
            if (options.maximumImageFileSize) {
                var unit = Math.floor(Math.log(options.maximumImageFileSize) / Math.log(1024));
                var readableSize = (options.maximumImageFileSize / Math.pow(1024, unit)).toFixed(2) * 1 +
                ' ' + ' KMGTP'[unit] + 'B';
                imageLimitation = '<small>' + lang.image.maximumFileSize + ' : ' + readableSize + '</small>';
            }

            var body =
            '<div class="row">' +
                '<div class="col s12">' +
                    '<div class="file-field input-field">' +
                        '<div class="btn file-uploader-wrapper">' +
                            '<span>Files</span>' +
                            '<input class="note-image-input" type="file" multiple>' +
                        '</div>' +
                        '<div class="file-path-wrapper">' +
                            '<input class="file-path" type="text" placeholder="' + lang.image.selectFromFiles + '">' +
                        '</div>' +
                    '</div>' +
                    imageLimitation +
                '</div>' +
            '</div>' +

            '<div clas="row">' +
                '<div class="input-field col s12">' +
                    '<input class="note-image-url" id="image-url" type="text">' +
                    '<label for="image-url">' + lang.image.url + '</label>' +
                '</div>' +
            '</div>' +

            '<div class="row">' +
                '<div class="col s12 m6">' +
                    '<input type="checkbox" id="note-image-responsive" class="note-image-option" checked="checked" />' +
                    '<label class="note-table-option" for="note-image-responsive">' + lang.image.responsive + '</label>' +
                '</div>' +
            '</div>';

            var footer = [
                '<a href="#!" class="modal-action modal-close waves-effect waves-light btn ">' + lang.shortcut.close + '</a>',
                '<button href="#" class="btn note-image-btn disabled" disabled>' + lang.image.insert + '</button>'
            ].join('');

            this.$dialog = ui.dialog({
                title: lang.image.insert,
                body: body,
                footer: footer,
                id: 'note-image-modal'
            }).render().appendTo($container);

            // init materialize modal plugin
            this.$dialog.modal({
                ready: function() {
                    var $imageInput = self.$dialog.find('.note-image-input'),
                        $imageUrl = self.$dialog.find('.note-image-url'),
                        $imageBtn = self.$dialog.find('.note-image-btn');

                    ui.toggleBtn($imageBtn, false);
                    context.triggerEvent('dialog.shown');

                    // Cloning imageInput to clear element.
                    $imageInput.replaceWith($imageInput.clone()
                    .on('change', function () {
                        data.resolve(this.files || this.value);
                    })
                    .val('')
                    );
                    // clean file-path input
                    self.$dialog.find('.file-path').val('');

                    $imageBtn.click(function (event) {
                        event.preventDefault();
                        data.resolve($imageUrl.val());
                    });

                    $imageUrl.on('keyup paste', function () {
                        var url = $imageUrl.val();
                        ui.toggleBtn($imageBtn, url);
                    }).val('').trigger('focus');
                    self.bindEnterKey($imageUrl, $imageBtn);
                },
                complete: function() {
                    var $imageInput = self.$dialog.find('.note-image-input'),
                        $imageUrl = self.$dialog.find('.note-image-url'),
                        $imageBtn = self.$dialog.find('.note-image-btn');

                    $imageInput.off('change');
                    $imageUrl.off('keyup paste keypress');
                    $imageBtn.off('click');

                    if (data.state() === 'pending') {
                        data.reject();
                    }
                }
            });
        };

        this.destroy = function () {
            ui.hideDialog(this.$dialog);
            this.$dialog.remove();
        };

        this.bindEnterKey = function ($input, $btn) {
            $input.on('keypress', function (event) {
                if (event.keyCode === key.code.ENTER) {
                    $btn.trigger('click');
                }
            });
        };

        this.show = function () {
            context.invoke('editor.saveRange');
            ui.showDialog(self.$dialog);
            data = $.Deferred();

            data.then(function (images) {
                let imageOptions = {
                    responsive: self.$dialog.find('#note-image-responsive').prop('checked')
                };

                // [workaround] hide dialog before restore range for IE range focus
                ui.hideDialog(self.$dialog);
                context.invoke('editor.restoreRange');

                if (typeof images === 'string') { // image url
                    context.invoke('editor.insertImage', {images: images, imageOptions: imageOptions});
                } else { // array of files
                    context.invoke('editor.insertImagesOrCallback', {images: images, imageOptions: imageOptions});
                }
            }).fail(function () {
                context.invoke('editor.restoreRange');
            });
        };
    };


    /**
    * Image popover module
    *  mouse events that show/hide popover will be handled by Handle.js.
    *  Handle.js will receive the events and invoke 'imagePopover.update'.
    */
    var ImagePopover = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var options = context.options;

        this.events = {
            'materialnote.disable': function () {
                self.hide();
            }
        };

        this.shouldInitialize = function () {
            return !list.isEmpty(options.popover.image);
        };

        this.initialize = function () {
            this.$popover = ui.popover({
                className: 'note-image-popover'
            }).render().appendTo('body');
            var $content = this.$popover.find('.popover-content');

            context.invoke('buttons.build', $content, options.popover.image);
        };

        this.destroy = function () {
            this.$popover.remove();
        };

        this.update = function (target) {
            if (dom.isImg(target)) {
                var pos = dom.posFromPlaceholder(target);
                let $editable = context.layoutInfo.editable;
                let editableBottom = $editable.height() + $editable.offset().top;
                let topPosition = pos.top;
                let imageInfo = context.invoke('editor.getImageInfo', target);

                if (topPosition > (editableBottom - 15)) {
                    topPosition = editableBottom - 15;
                }

                // handle buttons active status
                // sizes
                this.$popover.find('.btn-group.note-imagesize').children('.note-btn').removeClass('active');
                if (imageInfo.size) {
                    let size = imageInfo.size;

                    this.$popover.find('#note-image-size-' + size).addClass('active');
                }

                // float
                this.$popover.find('.btn-group.note-float').children('.note-btn').removeClass('active');
                if (imageInfo.float) {
                    let float = imageInfo.float;

                    this.$popover.find('#note-image-float-' + float).addClass('active');
                }
                else {
                    this.$popover.find('#note-image-float-none').addClass('active');
                }

                // responsivity
                this.$popover.find('.btn-group.note-responsivity').children('.note-btn').removeClass('active');
                if (imageInfo.responsive) {
                    this.$popover.find('#note-image-responsive').addClass('active');
                }

                this.$popover.css({
                    display: 'block',
                    left: pos.left,
                    top: topPosition
                });
            } else {
                this.hide();
            }
        };

        this.hide = function () {
            this.$popover.hide();
        };
    };

    var TablePopover = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var options = context.options;

        this.events = {
            'materialnote.mousedown': function (we, e) {
                self.update(e.target);
            },
            'materialnote.keyup materialnote.scroll': function () {
                self.update();
            },
            'materialnote.change': function(event, target) {
                self.update(target);
            },
            'materialnote.disable': function () {
                self.hide();
            }
        };

        this.shouldInitialize = function () {
            return !list.isEmpty(options.popover.table);
        };

        this.initialize = function () {
            this.$popover = ui.popover({
                className: 'note-table-popover'
            }).render().appendTo('body');
            var $content = this.$popover.find('.popover-content');

            context.invoke('buttons.build', $content, options.popover.table);

            // [workaround] Disable Firefox's default table editor
            if (agent.isFF) {
                document.execCommand('enableInlineTableEditing', false, false);
            }
        };

        this.destroy = function () {
            this.$popover.remove();
        };

        this.update = function (target) {
            if (context.isDisabled()) {
                return false;
            }

            let isCell = dom.isCell(target);
            let isTable = dom.isTable(target);

            if (isTable || isCell) {
                let tableInfo = context.invoke('editor.getTableInfo', target);

                // handle buttons active status
                this.$popover.find('.btn-group.note-materializeOptions').children('.note-btn').removeClass('active');
                if (tableInfo.bordered) {
                    this.$popover.find('#note-table-bordered').addClass('active');
                }
                if (tableInfo.striped) {
                    this.$popover.find('#note-table-striped').addClass('active');
                }
                if (tableInfo.highlighted) {
                    this.$popover.find('#note-table-highlighted').addClass('active');
                }
                if (tableInfo.responsive) {
                    this.$popover.find('#note-table-responsive').addClass('active');
                }
                if (tableInfo.centered) {
                    this.$popover.find('#note-table-centered').addClass('active');
                }

                if (isCell) {
                    let pos = dom.posFromPlaceholder(target);

                    this.$popover.css({
                        display: 'block',
                        left: pos.left,
                        top: pos.top
                    });
                }
            }
            else {
                this.hide();
            }

            return isCell;
        };

        this.hide = function () {
            this.$popover.hide();
        };
    };

    var VideoDialog = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var $editor = context.layoutInfo.editor;
        var options = context.options;
        var lang = options.langInfo;
        var data;
        var text;

        this.initialize = function () {
            var $container = options.dialogsInBody ? $(document.body) : $editor;

            var body =
            '<div clas="row">' +
                '<div class="input-field col s12">' +
                    '<input class="note-video-url form-control" type="text" />' +
                    '<label>' + lang.video.url + lang.video.providers + '</label>' +
                '</div>' +
            '</div>';

            var footer = [
                '<a href="#!" class="modal-action modal-close waves-effect waves-light btn ">' + lang.shortcut.close + '</a>',
                '<button href="#" class="btn note-video-btn disabled" disabled>' + lang.video.insert + '</button>'
            ].join('');

            this.$dialog = ui.dialog({
                title: lang.video.insert,
                fade: options.dialogsFade,
                body: body,
                footer: footer,
                id: 'note-video-modal'
            }).render().appendTo($container);

            this.$dialog.modal({
                ready: function() {
                    var $videoUrl = self.$dialog.find('.note-video-url'),
                    $videoBtn = self.$dialog.find('.note-video-btn');

                    ui.toggleBtn($videoBtn, false);
                    context.triggerEvent('dialog.shown');

                    $videoUrl.val(text).on('input', function () {
                        ui.toggleBtn($videoBtn, $videoUrl.val());
                    }).trigger('focus');

                    $videoBtn.click(function (event) {
                        event.preventDefault();

                        data.resolve($videoUrl.val());
                    });

                    self.bindEnterKey($videoUrl, $videoBtn);
                },
                complete: function() {
                    var $videoUrl = self.$dialog.find('.note-video-url'),
                    $videoBtn = self.$dialog.find('.note-video-btn');

                    $videoUrl.off('input');
                    $videoBtn.off('click');

                    if (data.state() === 'pending') {
                        data.reject();
                    }
                }
            });
        };

        this.destroy = function () {
            ui.hideDialog(this.$dialog);
            this.$dialog.remove();
        };

        this.bindEnterKey = function ($input, $btn) {
            $input.on('keypress', function (event) {
                if (event.keyCode === key.code.ENTER) {
                    $btn.trigger('click');
                }
            });
        };

        this.createVideoNode = function (url) {
            // video url patterns(youtube, instagram, vimeo, dailymotion, youku, mp4, ogg, webm)
            var ytRegExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            var ytMatch = url.match(ytRegExp);

            var igRegExp = /(?:www\.|\/\/)instagram\.com\/p\/(.[a-zA-Z0-9_-]*)/;
            var igMatch = url.match(igRegExp);

            var vRegExp = /\/\/vine\.co\/v\/([a-zA-Z0-9]+)/;
            var vMatch = url.match(vRegExp);

            var vimRegExp = /\/\/(player\.)?vimeo\.com\/([a-z]*\/)*(\d+)[?]?.*/;
            var vimMatch = url.match(vimRegExp);

            var dmRegExp = /.+dailymotion.com\/(video|hub)\/([^_]+)[^#]*(#video=([^_&]+))?/;
            var dmMatch = url.match(dmRegExp);

            var youkuRegExp = /\/\/v\.youku\.com\/v_show\/id_(\w+)=*\.html/;
            var youkuMatch = url.match(youkuRegExp);

            var qqRegExp = /\/\/v\.qq\.com.*?vid=(.+)/;
            var qqMatch = url.match(qqRegExp);

            var qqRegExp2 = /\/\/v\.qq\.com\/x?\/?(page|cover).*?\/([^\/]+)\.html\??.*/;
            var qqMatch2 = url.match(qqRegExp2);

            var mp4RegExp = /^.+.(mp4|m4v)$/;
            var mp4Match = url.match(mp4RegExp);

            var oggRegExp = /^.+.(ogg|ogv)$/;
            var oggMatch = url.match(oggRegExp);

            var webmRegExp = /^.+.(webm)$/;
            var webmMatch = url.match(webmRegExp);

            var $video;
            if (ytMatch && ytMatch[1].length === 11) {
                var youtubeId = ytMatch[1];
                $video = $('<iframe>')
                .attr('frameborder', 0)
                .attr('src', '//www.youtube.com/embed/' + youtubeId)
                .attr('width', '640').attr('height', '360');
            } else if (igMatch && igMatch[0].length) {
                $video = $('<iframe>')
                .attr('frameborder', 0)
                .attr('src', 'https://instagram.com/p/' + igMatch[1] + '/embed/')
                .attr('width', '612').attr('height', '710')
                .attr('scrolling', 'no')
                .attr('allowtransparency', 'true');
            } else if (vMatch && vMatch[0].length) {
                $video = $('<iframe>')
                .attr('frameborder', 0)
                .attr('src', vMatch[0] + '/embed/simple')
                .attr('width', '600').attr('height', '600')
                .attr('class', 'vine-embed');
            } else if (vimMatch && vimMatch[3].length) {
                $video = $('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>')
                .attr('frameborder', 0)
                .attr('src', '//player.vimeo.com/video/' + vimMatch[3])
                .attr('width', '640').attr('height', '360');
            } else if (dmMatch && dmMatch[2].length) {
                $video = $('<iframe>')
                .attr('frameborder', 0)
                .attr('src', '//www.dailymotion.com/embed/video/' + dmMatch[2])
                .attr('width', '640').attr('height', '360');
            } else if (youkuMatch && youkuMatch[1].length) {
                $video = $('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>')
                .attr('frameborder', 0)
                .attr('height', '498')
                .attr('width', '510')
                .attr('src', '//player.youku.com/embed/' + youkuMatch[1]);
            } else if ((qqMatch && qqMatch[1].length) || (qqMatch2 && qqMatch2[2].length)) {
                var vid = ((qqMatch && qqMatch[1].length) ? qqMatch[1]:qqMatch2[2]);
                $video = $('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>')
                .attr('frameborder', 0)
                .attr('height', '310')
                .attr('width', '500')
                .attr('src', 'http://v.qq.com/iframe/player.html?vid=' + vid + '&amp;auto=0');
            } else if (mp4Match || oggMatch || webmMatch) {
                $video = $('<video controls>')
                .attr('src', url)
                .attr('width', '640').attr('height', '360');
            } else {
                // this is not a known video link. Now what, Cat? Now what?
                return false;
            }

            $video[0].setAttribute('frameborder', 0);
            $video[0].setAttribute('allowfullscreen', '');

            var $node = $('<div>').addClass('video-container').append($video)[0];

            return $node;
        };

        this.show = function () {
            text = context.invoke('editor.getSelectedText');

            context.invoke('editor.saveRange');
            ui.showDialog(self.$dialog);
            data = $.Deferred();

            data.then(function (url) {
                // [workaround] hide dialog before restore range for IE range focus
                ui.hideDialog(self.$dialog);
                context.invoke('editor.restoreRange');

                // build node
                var $node = self.createVideoNode(url);

                if ($node) {
                    // insert video node
                    context.invoke('editor.insertNode', $node);
                }
            }).fail(function () {
                context.invoke('editor.restoreRange');
            });
        };
    };

    var HelpDialog = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var $editor = context.layoutInfo.editor;
        var options = context.options;
        var lang = options.langInfo;

        this.createShortCutList = function () {
            var keyMap = options.keyMap[agent.isMac ? 'mac' : 'pc'];

            return Object.keys(keyMap).map(function(key) {
                let command = keyMap[key];
                let $row = $('<div></div>');
                let $wrapper = $('<div class="row note-help-row"></div>');
                let $leftCol = $('<div class="col s12 m4 s3 note-help-row-left"><label><kbd>' + key + '</kdb></label></div>');
                let $rightCol = $('<div class="col s12 m8 s9 note-help-row-right"/>').html(context.memo('help.' + command) || command);

                $wrapper.append($leftCol).append($rightCol);
                $row.append($wrapper);

                return $row.html();
            }).join('');
        };

        this.initialize = function () {
            var $container = options.dialogsInBody ? $(document.body) : $editor;

            var footer = [
                '<p class="text-center">',
                '<a href="http://web-forge.info/materialnote" target="_blank">materialnote 2.0.0</a> - ',
                '<a href="https://github.com/Cerealkillerway/materialNote" target="_blank">' + lang.help.project + '</a> - ',
                '<a href="https://github.com/Cerealkillerway/materialNote/issues" target="_blank">' + lang.help.issues + '</a>',
                '</p>'
            ].join('');

            this.$dialog = ui.dialog({
                title: lang.options.help,
                fade: options.dialogsFade,
                body: '<div class="row help-content"><div class="help-container">' + this.createShortCutList() + '</div></div>',
                footer: footer,
                id: 'note-help-modal',
                callback: function ($node) {
                    $node.find('.modal-body').css({
                        'max-height': 300,
                        'overflow': 'scroll'
                    });
                }
            }).render().appendTo($container);

            this.$dialog.modal();
        };

        this.destroy = function () {
            ui.hideDialog(this.$dialog);
            this.$dialog.remove();
        };

        /**
        * show help dialog
        *
        * @return {Promise}
        */
        this.showHelpDialog = function () {
            return $.Deferred(function (deferred) {
                ui.onDialogShown(self.$dialog, function () {
                    context.triggerEvent('dialog.shown');
                    deferred.resolve();
                });
                ui.showDialog(self.$dialog);
            }).promise();
        };

        this.show = function () {
            context.invoke('editor.saveRange');
            this.showHelpDialog().then(function () {
                context.invoke('editor.restoreRange');
            });
        };
    };

  var AirPopover = function (context) {
    var self = this;
    var ui = $.materialnote.ui;

    var options = context.options;

    var AIR_MODE_POPOVER_X_OFFSET = 20;

    this.events = {
      'materialnote.keyup materialnote.mouseup materialnote.scroll': function () {
        self.update();
      },
      'materialnote.disable materialnote.change materialnote.dialog.shown': function () {
        self.hide();
      },
      'materialnote.focusout': function (we, e) {
        // [workaround] Firefox doesn't support relatedTarget on focusout
        //  - Ignore hide action on focus out in FF.
        if (agent.isFF) {
          return;
        }

        if (!e.relatedTarget || !dom.ancestor(e.relatedTarget, func.eq(self.$popover[0]))) {
          self.hide();
        }
      }
    };

    this.shouldInitialize = function () {
      return options.airMode && !list.isEmpty(options.popover.air);
    };

    this.initialize = function () {
      this.$popover = ui.popover({
        className: 'note-air-popover'
      }).render().appendTo('body');
      var $content = this.$popover.find('.popover-content');

      context.invoke('buttons.build', $content, options.popover.air);
    };

    this.destroy = function () {
      this.$popover.remove();
    };

    this.update = function () {
      var styleInfo = context.invoke('editor.currentStyle');
      if (styleInfo.range && !styleInfo.range.isCollapsed()) {
        var rect = list.last(styleInfo.range.getClientRects());
        if (rect) {
          var bnd = func.rect2bnd(rect);
          this.$popover.css({
            display: 'block',
            left: Math.max(bnd.left + bnd.width / 2, 0) - AIR_MODE_POPOVER_X_OFFSET,
            top: bnd.top + bnd.height
          });
        }
      } else {
        this.hide();
      }
    };

    this.hide = function () {
      this.$popover.hide();
    };
  };

  var HintPopover = function (context) {
    var self = this;
    var ui = $.materialnote.ui;

    var POPOVER_DIST = 5;
    var hint = context.options.hint || [];
    var direction = context.options.hintDirection || 'bottom';
    var hints = $.isArray(hint) ? hint : [hint];

    this.events = {
      'materialnote.keyup': function (we, e) {
        if (!e.isDefaultPrevented()) {
          self.handleKeyup(e);
        }
      },
      'materialnote.keydown': function (we, e) {
        self.handleKeydown(e);
      },
      'materialnote.disable materialnote.dialog.shown': function () {
        self.hide();
      }
    };

    this.shouldInitialize = function () {
      return hints.length > 0;
    };

    this.initialize = function () {
      this.lastWordRange = null;
      this.$popover = ui.popover({
        className: 'note-hint-popover',
        hideArrow: true,
        direction: ''
      }).render().appendTo('body');

      this.$popover.hide();

      this.$content = this.$popover.find('.popover-content');

      this.$content.on('click', '.note-hint-item', function () {
        self.$content.find('.active').removeClass('active');
        $(this).addClass('active');
        self.replace();
      });
    };

    this.destroy = function () {
      this.$popover.remove();
    };

    this.selectItem = function ($item) {
      this.$content.find('.active').removeClass('active');
      $item.addClass('active');

      this.$content[0].scrollTop = $item[0].offsetTop - (this.$content.innerHeight() / 2);
    };

    this.moveDown = function () {
      var $current = this.$content.find('.note-hint-item.active');
      var $next = $current.next();

      if ($next.length) {
        this.selectItem($next);
      } else {
        var $nextGroup = $current.parent().next();

        if (!$nextGroup.length) {
          $nextGroup = this.$content.find('.note-hint-group').first();
        }

        this.selectItem($nextGroup.find('.note-hint-item').first());
      }
    };

    this.moveUp = function () {
      var $current = this.$content.find('.note-hint-item.active');
      var $prev = $current.prev();

      if ($prev.length) {
        this.selectItem($prev);
      } else {
        var $prevGroup = $current.parent().prev();

        if (!$prevGroup.length) {
          $prevGroup = this.$content.find('.note-hint-group').last();
        }

        this.selectItem($prevGroup.find('.note-hint-item').last());
      }
    };

    this.replace = function () {
      var $item = this.$content.find('.note-hint-item.active');

      if ($item.length) {
        var node = this.nodeFromItem($item);
        // XXX: consider to move codes to editor for recording redo/undo.
        this.lastWordRange.insertNode(node);
        range.createFromNode(node).collapse().select();

        this.lastWordRange = null;
        this.hide();
        context.triggerEvent('change', context.layoutInfo.editable.html(), context.layoutInfo.editable);
        context.invoke('editor.focus');
      }

    };

    this.nodeFromItem = function ($item) {
      var hint = hints[$item.data('index')];
      var item = $item.data('item');
      var node = hint.content ? hint.content(item) : item;
      if (typeof node === 'string') {
        node = dom.createText(node);
      }
      return node;
    };

    this.createItemTemplates = function (hintIdx, items) {
      var hint = hints[hintIdx];
      return items.map(function (item, idx) {
        var $item = $('<div class="note-hint-item"/>');
        $item.append(hint.template ? hint.template(item) : item + '');
        $item.data({
          'index': hintIdx,
          'item': item
        });

        if (hintIdx === 0 && idx === 0) {
          $item.addClass('active');
        }
        return $item;
      });
    };

    this.handleKeydown = function (e) {
      if (!this.$popover.is(':visible')) {
        return;
      }

      if (e.keyCode === key.code.ENTER) {
        e.preventDefault();
        this.replace();
      } else if (e.keyCode === key.code.UP) {
        e.preventDefault();
        this.moveUp();
      } else if (e.keyCode === key.code.DOWN) {
        e.preventDefault();
        this.moveDown();
      }
    };

    this.searchKeyword = function (index, keyword, callback) {
      var hint = hints[index];
      if (hint && hint.match.test(keyword) && hint.search) {
        var matches = hint.match.exec(keyword);
        hint.search(matches[1], callback);
      } else {
        callback();
      }
    };

    this.createGroup = function (idx, keyword) {
      var $group = $('<div class="note-hint-group note-hint-group-' + idx + '"/>');
      this.searchKeyword(idx, keyword, function (items) {
        items = items || [];
        if (items.length) {
          $group.html(self.createItemTemplates(idx, items));
          self.show();
        }
      });

      return $group;
    };

    this.handleKeyup = function (e) {
      if (list.contains([key.code.ENTER, key.code.UP, key.code.DOWN], e.keyCode)) {
        if (e.keyCode === key.code.ENTER) {
          if (this.$popover.is(':visible')) {
            return;
          }
        }
      } else {
        var wordRange = context.invoke('editor.createRange').getWordRange();
        var keyword = wordRange.toString();
        if (hints.length && keyword) {
          this.$content.empty();

          var bnd = func.rect2bnd(list.last(wordRange.getClientRects()));
          if (bnd) {

            this.$popover.hide();

            this.lastWordRange = wordRange;

            hints.forEach(function (hint, idx) {
              if (hint.match.test(keyword)) {
                self.createGroup(idx, keyword).appendTo(self.$content);
              }
            });

            // set position for popover after group is created
            if (direction === 'top') {
              this.$popover.css({
                left: bnd.left,
                top: bnd.top - this.$popover.outerHeight() - POPOVER_DIST
              });
            } else {
              this.$popover.css({
                left: bnd.left,
                top: bnd.top + bnd.height + POPOVER_DIST
              });
            }

          }
        } else {
          this.hide();
        }
      }
    };

    this.show = function () {
      this.$popover.show();
    };

    this.hide = function () {
      this.$popover.hide();
    };
  };

    var CardDialog = function (context) {
        var self = this;
        var ui = $.materialnote.ui;

        var $editor = context.layoutInfo.editor;
        var options = context.options;
        var lang = options.langInfo;
        var data;
        var text;

        this.initialize = function () {
            var $container = options.dialogsInBody ? $(document.body) : $editor;

            var body = [
                '<div class="row noMargins">',
                    '<div class="col s12">',
                        '<ul class="tabs">',
                            '<li class="tab col s6"><a class="active" href="#note-card-background-color">' + lang.color.background + '</a></li>',
                            '<li class="tab col s6"><a href="#note-card-foreground-color">' + lang.color.foreground + '</a></li>',
                        '</ul>',
                    '</div>',
                '</div>',
                '<div class="row noMargins">',
                    '<div id="note-card-background-color" class="col s12">',
                        '<div class="row noMargins">',
                            '<div class="col s6">',
                                '<div class="color-name"></div>',
                            '</div>',
                        '</div>',
                        '<div class="note-holder" data-event="cardBackColor"></div>',
                    '</div>',
                    '<div id="note-card-foreground-color" class="col s12">',
                        '<div class="row noMargins">',
                            '<div class="col s6">',
                                '<div class="color-name"></div>',
                            '</div>',
                        '</div>',
                        '<div class="note-holder" data-event="cardForeColor"/></div>',
                    '</div>',
                '</div>'
            ].join('');

            var footer = [
                '<a href="#!" class="modal-action modal-close waves-effect waves-light btn ">' + lang.shortcut.close + '</a>',
                '<button href="#" class="btn note-video-btn disabled" disabled>' + lang.materializeComponents.card.insert + '</button>'
            ].join('');

            this.$dialog = ui.dialog({
                title: lang.materializeComponents.card.card,
                fade: options.dialogsFade,
                body: body,
                footer: footer,
                id: 'note-card-modal'
            }).render().appendTo($container);

            this.$dialog.modal({
                ready: function() {
                    self.$dialog.find('.note-holder').each(function () {
                        let $holder = $(this);
                        let $tabs = self.$dialog.find('ul.tabs');

                        $holder.append(ui.palette({
                            colors: options.colors,
                            colorNames: options.colorNames,
                            eventName: $holder.data('event'),
                        }).render());

                        // in this tabs initialization the indicator width will not be set since the plugin does not work
                        // with hidden elements (display: none);
                        // as a workaround the indicator width is forced to 50% in the css
                        $tabs.tabs({
                            //swipeable: true
                        });
                    });

                    //self.bindEnterKey($videoUrl, $videoBtn);
                },
                complete: function() {
                    var $videoUrl = self.$dialog.find('.note-video-url'),
                    $videoBtn = self.$dialog.find('.note-video-btn');

                    $videoUrl.off('input');
                    $videoBtn.off('click');

                    if (data.state() === 'pending') {
                        data.reject();
                    }
                }
            });
        };

        this.destroy = function () {
            ui.hideDialog(this.$dialog);
            this.$dialog.remove();
        };

        this.bindEnterKey = function ($input, $btn) {
            $input.on('keypress', function (event) {
                if (event.keyCode === key.code.ENTER) {
                    $btn.trigger('click');
                }
            });
        };

        this.createVideoNode = function (url) {
            // video url patterns(youtube, instagram, vimeo, dailymotion, youku, mp4, ogg, webm)
            var ytRegExp = /^(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
            var ytMatch = url.match(ytRegExp);

            var igRegExp = /(?:www\.|\/\/)instagram\.com\/p\/(.[a-zA-Z0-9_-]*)/;
            var igMatch = url.match(igRegExp);

            var vRegExp = /\/\/vine\.co\/v\/([a-zA-Z0-9]+)/;
            var vMatch = url.match(vRegExp);

            var vimRegExp = /\/\/(player\.)?vimeo\.com\/([a-z]*\/)*(\d+)[?]?.*/;
            var vimMatch = url.match(vimRegExp);

            var dmRegExp = /.+dailymotion.com\/(video|hub)\/([^_]+)[^#]*(#video=([^_&]+))?/;
            var dmMatch = url.match(dmRegExp);

            var youkuRegExp = /\/\/v\.youku\.com\/v_show\/id_(\w+)=*\.html/;
            var youkuMatch = url.match(youkuRegExp);

            var qqRegExp = /\/\/v\.qq\.com.*?vid=(.+)/;
            var qqMatch = url.match(qqRegExp);

            var qqRegExp2 = /\/\/v\.qq\.com\/x?\/?(page|cover).*?\/([^\/]+)\.html\??.*/;
            var qqMatch2 = url.match(qqRegExp2);

            var mp4RegExp = /^.+.(mp4|m4v)$/;
            var mp4Match = url.match(mp4RegExp);

            var oggRegExp = /^.+.(ogg|ogv)$/;
            var oggMatch = url.match(oggRegExp);

            var webmRegExp = /^.+.(webm)$/;
            var webmMatch = url.match(webmRegExp);

            var $video;
            if (ytMatch && ytMatch[1].length === 11) {
                var youtubeId = ytMatch[1];
                $video = $('<iframe>')
                .attr('frameborder', 0)
                .attr('src', '//www.youtube.com/embed/' + youtubeId)
                .attr('width', '640').attr('height', '360');
            } else if (igMatch && igMatch[0].length) {
                $video = $('<iframe>')
                .attr('frameborder', 0)
                .attr('src', 'https://instagram.com/p/' + igMatch[1] + '/embed/')
                .attr('width', '612').attr('height', '710')
                .attr('scrolling', 'no')
                .attr('allowtransparency', 'true');
            } else if (vMatch && vMatch[0].length) {
                $video = $('<iframe>')
                .attr('frameborder', 0)
                .attr('src', vMatch[0] + '/embed/simple')
                .attr('width', '600').attr('height', '600')
                .attr('class', 'vine-embed');
            } else if (vimMatch && vimMatch[3].length) {
                $video = $('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>')
                .attr('frameborder', 0)
                .attr('src', '//player.vimeo.com/video/' + vimMatch[3])
                .attr('width', '640').attr('height', '360');
            } else if (dmMatch && dmMatch[2].length) {
                $video = $('<iframe>')
                .attr('frameborder', 0)
                .attr('src', '//www.dailymotion.com/embed/video/' + dmMatch[2])
                .attr('width', '640').attr('height', '360');
            } else if (youkuMatch && youkuMatch[1].length) {
                $video = $('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>')
                .attr('frameborder', 0)
                .attr('height', '498')
                .attr('width', '510')
                .attr('src', '//player.youku.com/embed/' + youkuMatch[1]);
            } else if ((qqMatch && qqMatch[1].length) || (qqMatch2 && qqMatch2[2].length)) {
                var vid = ((qqMatch && qqMatch[1].length) ? qqMatch[1]:qqMatch2[2]);
                $video = $('<iframe webkitallowfullscreen mozallowfullscreen allowfullscreen>')
                .attr('frameborder', 0)
                .attr('height', '310')
                .attr('width', '500')
                .attr('src', 'http://v.qq.com/iframe/player.html?vid=' + vid + '&amp;auto=0');
            } else if (mp4Match || oggMatch || webmMatch) {
                $video = $('<video controls>')
                .attr('src', url)
                .attr('width', '640').attr('height', '360');
            } else {
                // this is not a known video link. Now what, Cat? Now what?
                return false;
            }

            $video[0].setAttribute('frameborder', 0);
            $video[0].setAttribute('allowfullscreen', '');

            var $node = $('<div>').addClass('video-container').append($video)[0];

            return $node;
        };

        this.show = function () {
            text = context.invoke('editor.getSelectedText');

            context.invoke('editor.saveRange');
            ui.showDialog(self.$dialog);
            data = $.Deferred();

            data.then(function (url) {
                // [workaround] hide dialog before restore range for IE range focus
                ui.hideDialog(self.$dialog);
                context.invoke('editor.restoreRange');

                // build node
                var $node = self.createVideoNode(url);

                if ($node) {
                    // insert video node
                    context.invoke('editor.insertNode', $node);
                }
            }).fail(function () {
                context.invoke('editor.restoreRange');
            });
        };
    };


    $.materialnote = $.extend($.materialnote, {
        version: '2.0.0',
        ui: ui,
        dom: dom,

        plugins: {},

        options: {
            modules: {
                'editor': Editor,
                'clipboard': Clipboard,
                'dropzone': Dropzone,
                'codeview': Codeview,
                'statusbar': Statusbar,
                'fullscreen': Fullscreen,
                'handle': Handle,
                // FIXME: HintPopover must be front of autolink
                //  - Script error about range when Enter key is pressed on hint popover
                'hintPopover': HintPopover,
                'autoLink': AutoLink,
                'autoSync': AutoSync,
                'placeholder': Placeholder,
                'buttons': Buttons,
                'toolbar': Toolbar,
                'linkDialog': LinkDialog,
                'linkPopover': LinkPopover,
                'imageDialog': ImageDialog,
                'imagePopover': ImagePopover,
                'tablePopover': TablePopover,
                'videoDialog': VideoDialog,
                'helpDialog': HelpDialog,
                'airPopover': AirPopover,
                'cardDialog': CardDialog
            },

            buttons: {},

            lang: 'en-US',

            // toolbar
            toolbar: [
                ['style', ['style']],
                ['font', ['bold', 'underline', 'clear']],
                ['fontname', ['fontname']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['table', ['table']],
                ['insert', ['link', 'picture', 'video']],
                ['view', ['fullscreen', 'codeview', 'help']]
            ],

            // popover
            popover: {
                image: [
                    ['imagesize', ['imageSize100', 'imageSize50', 'imageSize25']],
                    ['float', ['floatLeft', 'floatRight', 'floatNone']],
                    ['responsivity', ['responsive']],
                    ['remove', ['removeMedia']]
                ],
                link: [
                    ['link', ['linkDialogShow', 'openLinkNewWindow', 'unlink']]
                ],
                table: [
                    ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
                    ['materializeOptions', ['borderedTable', 'stripedTable', 'highlightedTable', 'responsiveTable', 'centeredTable']],
                    ['delete', ['deleteRow', 'deleteCol', 'deleteTable']]
                ],
                air: [
                    ['color', ['color']],
                    ['font', ['bold', 'underline', 'clear']],
                    ['para', ['ul', 'paragraph']],
                    ['table', ['table']],
                    ['insert', ['link', 'picture']]
                ]
            },

            // air mode: inline editor
            airMode: false,

            width: null,
            height: null,
            linkTargetBlank: true,

            focus: false,
            tabSize: 4,
            styleWithSpan: true,
            shortcuts: true,
            textareaAutoSync: true,
            direction: null,
            tooltip: 'auto',

            styleTags: ['p', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],

            fontNames: [
                'Roboto', 'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New',
                'Helvetica Neue', 'Helvetica', 'Impact', 'Lucida Grande',
                'Tahoma', 'Times New Roman', 'Verdana'
            ],

            fontSizes: ['10', '11', '12', '13', '14', '15', '16', '18', '24', '36', '48'],

            // following toolbar
            followingToolbar: true,
            otherStaticBarClass: 'topBar',

            // pallete colors(n x n)
            colors: [
                ['#FFEBEE', '#fce4ec', '#f3e5f5', '#ede7f6', '#e8eaf6', '#E3F2FD', '#e1f5fe', '#e0f7fa', '#e0f2f1', '#E8F5E9', '#f1f8e9', '#f9fbe7', '#fffde7', '#fff8e1', '#fff3e0', '#fbe9e7', '#fafafa'],
                ['#FFCDD2', '#f8bbd0', '#e1bee7', '#d1c4e9', '#c5cae9', '#BBDEFB', '#b3e5fc', '#b2ebf2', '#b2dfdb', '#C8E6C9', '#dcedc8', '#f0f4c3', '#fff9c4', '#ffecb3', '#ffe0b2', '#ffccbc', '#f5f5f5'],
                ['#EF9A9A', '#f48fb1', '#ce93d8', '#b39ddb', '#9fa8da', '#90CAF9', '#81d4fa', '#80deea', '#80cbc4', '#A5D6A7', '#c5e1a5', '#e6ee9c', '#fff59d', '#ffe082', '#ffcc80', '#ffab91', '#eeeeee'],
                ['#E57373', '#f06292', '#ba68c8', '#9575cd', '#7986cb', '#64B5F6', '#4fc3f7', '#4dd0e1', '#4db6ac', '#81C784', '#aed581', '#dce775', '#fff176', '#ffd54f', '#ffb74d', '#ff8a65', '#e0e0e0'],
                ['#EF5350', '#ec407a', '#ab47bc', '#7e57c2', '#5c6bc0', '#42A5F5', '#29b6f6', '#26c6da', '#26a69a', '#66BB6A', '#9ccc65', '#d4e157', '#ffee58', '#ffca28', '#ffa726', '#ff7043', '#bdbdbd'],
                ['#F44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196F3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722', '#9e9e9e'],
                ['#E53935', '#d81b60', '#8e24aa', '#5e35b1', '#3949ab', '#1E88E5', '#039be5', '#00acc1', '#00897b', '#43A047', '#7cb342', '#c0ca33', '#fdd835', '#ffb300', '#fb8c00', '#f4511e', '#757575'],
                ['#D32F2F', '#c2185b', '#7b1fa2', '#512da8', '#303f9f', '#1976D2', '#0288d1', '#0097a7', '#00796b', '#388E3C', '#689f38', '#afb42b', '#fbc02d', '#ffa000', '#f57c00', '#e64a19', '#616161'],
                ['#C62828', '#ad1457', '#6a1b9a', '#4527a0', '#283593', '#1565C0', '#0277bd', '#00838f', '#00695c', '#2E7D32', '#558b2f', '#9e9d24', '#f9a825', '#ff8f00', '#ef6c00', '#d84315', '#424242'],
                ['#B71C1C', '#880e4f', '#4a148c', '#311b92', '#1a237e', '#0D47A1', '#01579b', '#006064', '#004d40', '#1B5E20', '#33691e', '#827717', '#f57f17', '#ff6f00', '#e65100', '#bf360c', '#212121'],
                ['#FF8A80', '#ff80ab', '#ea80fc', '#b388ff', '#8c9eff', '#82B1FF', '#80d8ff', '#84ffff', '#a7ffeb', '#B9F6CA', '#ccff90', '#f4ff81', '#ffff8d', '#ffe57f', '#ffd180', '#ff9e80', '#333333'],
                ['#FF5252', '#ff4081', '#e040fb', '#7c4dff', '#536dfe', '#448AFF', '#40c4ff', '#18ffff', '#64ffda', '#69F0AE', '#b2ff59', '#eeff41', '#ffff00', '#ffd740', '#ffab40', '#ff6e40', '#dddddd'],
                ['#FF1744', '#f50057', '#d500f9', '#651fff', '#3d5afe', '#2979FF', '#00b0ff', '#00e5ff', '#1de9b6', '#00E676', '#76ff03', '#c6ff00', '#ffea00', '#ffc400', '#ff9100', '#ff3d00', '#000000'],
                ['#D50000', '#c51162', '#aa00ff', '#6200ea', '#304ffe', '#2962FF', '#0091ea', '#00b8d4', '#00bfa5', '#00C853', '#64dd17', '#aeea00', '#ffd600', '#ffab00', '#ff6d00', '#dd2c00', '#ffffff']
            ],
            // materialize color names for color palette
            colorNames: [
                ['red lighten-5', 'pink lighten-5', 'purple lighten-5', 'deep-purple lighten-5', 'indigo lighten-5', 'blue lighten-5', 'light-blue lighten-5', 'cyan lighten-5', 'teal lighten-5', 'green lighten-5', 'light-green lighten-5', 'lime lighten-5', 'yellow lighten-5', 'amber lighten-5',  'orange lighten-5', 'deep-orange lighten-5', 'grey lighten-5'],
                ['red lighten-4', 'pink lighten-4', 'purple lighten-4', 'deep-purple lighten-4', 'indigo lighten-4', 'blue lighten-4', 'light-blue lighten-4', 'cyan lighten-4', 'teal lighten-4', 'green lighten-4', 'light-green lighten-4', 'lime lighten-4', 'yellow lighten-4', 'amber lighten-4',  'orange lighten-4', 'deep-orange lighten-4', 'grey lighten-4'],
                ['red lighten-3', 'pink lighten-3', 'purple lighten-3', 'deep-purple lighten-3', 'indigo lighten-3', 'blue lighten-3', 'light-blue lighten-3', 'cyan lighten-3', 'teal lighten-3', 'green lighten-3', 'light-green lighten-3', 'lime lighten-3', 'yellow lighten-3', 'amber lighten-3',  'orange lighten-3', 'deep-orange lighten-3', 'grey lighten-3'],
                ['red lighten-2', 'pink lighten-2', 'purple lighten-2', 'deep-purple lighten-2', 'indigo lighten-2', 'blue lighten-2', 'light-blue lighten-2', 'cyan lighten-2', 'teal lighten-2', 'green lighten-2', 'light-green lighten-2', 'lime lighten-2', 'yellow lighten-2', 'amber lighten-2',  'orange lighten-2', 'deep-orange lighten-2', 'grey lighten-2'],
                ['red lighten-1', 'pink lighten-1', 'purple lighten-1', 'deep-purple lighten-1', 'indigo lighten-1', 'blue lighten-1', 'light-blue lighten-1', 'cyan lighten-1', 'teal lighten-1', 'green lighten-1', 'light-green lighten-1', 'lime lighten-1', 'yellow lighten-1', 'amber lighten-1',  'orange lighten-1', 'deep-orange lighten-1', 'grey lighten-1'],
                ['red',           'pink',           'purple',           'deep-purple',           'indigo',           'blue',           'light-blue',           'cyan',           'teal',           'green',           'light-green',           'lime',           'yellow',           'amber',            'orange',           'deep-orange',           'grey'],
                ['red darken-1',  'pink darken-1',  'purple darken-1',  'deep-purple darken-1',  'indigo darken-1',  'blue darken-1',  'light-blue darken-1',  'cyan darken-1',  'teal darken-1',  'green darken-1',  'light-green darken-1',  'lime darken-1',  'yellow darken-1',  'amber darken-1',   'orange darken-1',  'deep-orange darken-1',  'grey darken-1'],
                ['red darken-2',  'pink darken-2',  'purple darken-2',  'deep-purple darken-2',  'indigo darken-2',  'blue darken-2',  'light-blue darken-2',  'cyan darken-2',  'teal darken-2',  'green darken-2',  'light-green darken-2',  'lime darken-2',  'yellow darken-2',  'amber darken-2',   'orange darken-2',  'deep-orange darken-2',  'grey darken-2'],
                ['red darken-3',  'pink darken-3',  'purple darken-3',  'deep-purple darken-3',  'indigo darken-3',  'blue darken-3',  'light-blue darken-3',  'cyan darken-3',  'teal darken-3',  'green darken-3',  'light-green darken-3',  'lime darken-3',  'yellow darken-3',  'amber darken-3',   'orange darken-3',  'deep-orange darken-3',  'grey darken-3'],
                ['red darken-4',  'pink darken-4',  'purple darken-4',  'deep-purple darken-4',  'indigo darken-4',  'blue darken-4',  'light-blue darken-4',  'cyan darken-4',  'teal darken-4',  'green darken-4',  'light-green darken-4',  'lime darken-4',  'yellow darken-4',  'amber darken-4',   'orange darken-4',  'deep-orange darken-4',  'grey darken-4'],
                ['red accent-1',  'pink accent-1',  'purple accent-1',  'deep-purple accent-1',  'indigo accent-1',  'blue accent-1',  'light-blue accent-1',  'cyan accent-1',  'teal accent-1',  'green accent-1',  'light-green accent-1',  'lime accent-1',  'yellow accent-1',  'amber accent-1',   'orange accent-1',  'deep-orange accent-1',  'grey custom-dark'],
                ['red accent-2',  'pink accent-2',  'purple accent-2',  'deep-purple accent-2',  'indigo accent-2',  'blue accent-2',  'light-blue accent-2',  'cyan accent-2',  'teal accent-2',  'green accent-2',  'light-green accent-2',  'lime accent-2',  'yellow accent-2',  'amber accent-2',   'orange accent-2',  'deep-orange accent-2',  'grey custom-light'],
                ['red accent-3',  'pink accent-3',  'purple accent-3',  'deep-purple accent-3',  'indigo accent-3',  'blue accent-3',  'light-blue accent-3',  'cyan accent-3',  'teal accent-3',  'green accent-3',  'light-green accent-3',  'lime accent-3',  'yellow accent-3',  'amber accent-3',   'orange accent-3',  'deep-orange accent-3',  'black'],
                ['red accent-4',  'pink accent-4',  'purple accent-4',  'deep-purple accent-4',  'indigo accent-4',  'blue accent-4',  'light-blue accent-4',  'cyan accent-4',  'teal accent-4',  'green accent-4',  'light-green accent-4',  'lime accent-4',  'yellow accent-4',  'amber accent-4',   'orange accent-4',  'deep-orange accent-4',  'white']
            ],

            defaultColors: {
                text: '#eeeeee',
                background: '#212121',

                cardText: 'grey lighten-5',
                cardBackground: 'grey darken-4'
            },

            lineHeights: ['1.0', '1.2', '1.4', '1.5', '1.6', '1.8', '2.0', '3.0'],

            tableClassName: '',

            insertTableMaxSize: {
                col: 10,
                row: 10
            },

            dialogsInBody: false,
            dialogsFade: false,

            maximumImageFileSize: null,

            callbacks: {
                onInit: null,
                onFocus: null,
                onBlur: null,
                onEnter: null,
                onKeyup: null,
                onKeydown: null,
                onImageUpload: null,
                onImageUploadError: null
            },

            codemirror: {
                mode: 'text/html',
                htmlMode: true,
                lineNumbers: true
            },

            keyMap: {
                pc: {
                    'ENTER': 'insertParagraph',
                    'CTRL+Z': 'undo',
                    'CTRL+Y': 'redo',
                    'TAB': 'tab',
                    'SHIFT+TAB': 'untab',
                    'CTRL+B': 'bold',
                    'CTRL+I': 'italic',
                    'CTRL+U': 'underline',
                    'CTRL+SHIFT+S': 'strikethrough',
                    'CTRL+BACKSLASH': 'removeFormat',
                    'CTRL+SHIFT+L': 'justifyLeft',
                    'CTRL+SHIFT+E': 'justifyCenter',
                    'CTRL+SHIFT+R': 'justifyRight',
                    'CTRL+SHIFT+J': 'justifyFull',
                    'CTRL+SHIFT+NUM7': 'insertUnorderedList',
                    'CTRL+SHIFT+NUM8': 'insertOrderedList',
                    'CTRL+LEFTBRACKET': 'outdent',
                    'CTRL+RIGHTBRACKET': 'indent',
                    'CTRL+NUM0': 'formatPara',
                    'CTRL+NUM1': 'formatH1',
                    'CTRL+NUM2': 'formatH2',
                    'CTRL+NUM3': 'formatH3',
                    'CTRL+NUM4': 'formatH4',
                    'CTRL+NUM5': 'formatH5',
                    'CTRL+NUM6': 'formatH6',
                    'CTRL+ENTER': 'insertHorizontalRule',
                    'CTRL+K': 'linkDialog.show'
                },

                mac: {
                    'ENTER': 'insertParagraph',
                    'CMD+Z': 'undo',
                    'CMD+SHIFT+Z': 'redo',
                    'TAB': 'tab',
                    'SHIFT+TAB': 'untab',
                    'CMD+B': 'bold',
                    'CMD+I': 'italic',
                    'CMD+U': 'underline',
                    'CMD+SHIFT+S': 'strikethrough',
                    'CMD+BACKSLASH': 'removeFormat',
                    'CMD+SHIFT+L': 'justifyLeft',
                    'CMD+SHIFT+E': 'justifyCenter',
                    'CMD+SHIFT+R': 'justifyRight',
                    'CMD+SHIFT+J': 'justifyFull',
                    'CMD+SHIFT+NUM7': 'insertUnorderedList',
                    'CMD+SHIFT+NUM8': 'insertOrderedList',
                    'CMD+LEFTBRACKET': 'outdent',
                    'CMD+RIGHTBRACKET': 'indent',
                    'CMD+NUM0': 'formatPara',
                    'CMD+NUM1': 'formatH1',
                    'CMD+NUM2': 'formatH2',
                    'CMD+NUM3': 'formatH3',
                    'CMD+NUM4': 'formatH4',
                    'CMD+NUM5': 'formatH5',
                    'CMD+NUM6': 'formatH6',
                    'CMD+ENTER': 'insertHorizontalRule',
                    'CMD+K': 'linkDialog.show'
                }
            },
            icons: {
                'align': 'note-icon-align',
                'alignCenter': 'note-icon-align-center',
                'alignJustify': 'note-icon-align-justify',
                'alignLeft': 'note-icon-align-left',
                'alignRight': 'note-icon-align-right',
                'rowBelow': 'note-icon-row-below',
                'colBefore': 'note-icon-col-before',
                'colAfter': 'note-icon-col-after',
                'rowAbove': 'note-icon-row-above',
                'rowRemove': 'note-icon-row-remove',
                'colRemove': 'note-icon-col-remove',
                'indent': 'note-icon-align-indent',
                'outdent': 'note-icon-align-outdent',
                'arrowsAlt': 'note-icon-arrows-alt',
                'bold': 'note-icon-bold',
                'caret': 'note-icon-caret',
                'circle': 'note-icon-circle',
                'close': 'note-icon-close',
                'code': 'note-icon-code',
                'eraser': 'note-icon-eraser',
                'font': 'note-icon-font',
                'frame': 'note-icon-frame',
                'italic': 'note-icon-italic',
                'link': 'note-icon-link',
                'unlink': 'note-icon-chain-broken',
                'magic': 'note-icon-magic',
                'menuCheck': 'note-icon-check',
                'minus': 'note-icon-minus',
                'orderedlist': 'note-icon-orderedlist',
                'pencil': 'note-icon-pencil',
                'picture': 'note-icon-picture',
                'question': 'note-icon-question',
                'redo': 'note-icon-redo',
                'square': 'note-icon-square',
                'strikethrough': 'note-icon-strikethrough',
                'subscript': 'note-icon-subscript',
                'superscript': 'note-icon-superscript',
                'table': 'note-icon-table',
                'textHeight': 'note-icon-text-height',
                'trash': 'note-icon-trash',
                'underline': 'note-icon-underline',
                'undo': 'note-icon-undo',
                'unorderedlist': 'note-icon-unorderedlist',
                'video': 'note-icon-video'
            }
        }
    });

}));
