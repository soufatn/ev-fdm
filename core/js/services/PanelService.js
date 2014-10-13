const DEFAULT_CONTAINER_ID = 'ev-default-panels-container';

angular.module('ev-fdm')
    .service('PanelService', ['$animate', '$q', '$http', '$templateCache', '$compile', '$rootScope', '$timeout', 
        '$window', 'PanelLayoutEngine', function ($animate, $q, $http, $templateCache, $compile, $rootScope, $timeout, 
            $window, panelLayoutEngine) {

        var containers   = {};
        var panelsList   = {};
        var stylesCache  = window.stylesCache = {};
        var self         = this;
        
        var addToDom = function (panel, containerId) {
            var container = containers[containerId];
            if (!container || panel.element.parent().length) {
                return;
            }

            // If no panel index, or no panel inside the container, it is added at the end
            if (!panel.index || !container.children().length) {
                $animate.move(panel.element, container, null, function () {
                    updateLayout(null, container);
                });
            } else {
                var beforePanel = getBeforePanel(panel.index, containerId);
                    $animate.move(panel.element, container, beforePanel, function () {
                        updateLayout(null, container);
                });
            }
        };

        function getBeforePanel(index, containerId) {
            var beforePanel = null;
            var panels = Object.keys(panelsList[containerId]).map(function (panelName) {
                return panelsList[containerId][panelName];
            });
            panels
                .filter(function (panel) {
                    return panel.element.parent().length;
                })
                .filter(function (panel) {
                    return panel.index;
                })
                .some(function (insertedPanel) {
                    var isBeforePanel = insertedPanel.index > index;
                    if (isBeforePanel) {
                        beforePanel = insertedPanel;
                    }
                    return !isBeforePanel;
                });
            return beforePanel || panels[0];
        }

        /**
         * Panel options are:
         * - name
         * - template or templateURL
         * - index
         */
        this.open = function (panel, id) {
            if (!id) {
                id = DEFAULT_CONTAINER_ID;
            }
            var panels = panelsList[id] = panelsList[id] || {};

            if (!panel.name && panel.panelName) {
                console.log("Deprecated: use name instead of panelName");
                panel.name = panel.panelName;
            }

            if (!panel) {
                console.log("A panel must have a name (options.name)");
                return;
            }

            // Change panelName to panel-name
            var name = panel.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

            if (panels[name]) {
                return panels[name];
            }

            // We call it *THE BEAST*.
            var element          = angular.element('<div class="ev-panel container-fluid ev-panel-' + 
                    name + '" ev-responsive-viewport style="' + getStylesFromCache(name, panel) + '"></div>');
            var templatePromises = getTemplatePromise(panel);
            panels[name]         = panel;
            panel.element      = element;

            return templatePromises.then(function(template) {
                element.html(template);
                element          = $compile(element)($rootScope.$new());
                panel.element  = element;

                element.resizable({
                    handles: "w",
                    helper: "ui-resizable-helper",
                });
                
                element.on('resizestop', function(event, ui) {
                    // resizable plugin does an unwanted height resize
                    // so we cancel the height set.
                    $(this).css("height","");

                    var beforePanel = element.prev();
                    var delta = ui.size.width - ui.originalSize.width;
                    beforePanel.width(beforePanel.width() - delta);
                    element.width(ui.size.width);
                    stylesCache[panel.panelName] = ui.size.width;
                    updateLayout(self, containers[id]);
                });

                addToDom(panel, id);
                return panel;
            });
        };


        this.close = function(name, containerId) {
            var panels = panelsList[containerId];

            if (!name || !panels[name]) {
                console.log("Panel not found for:" + name);
            }

            var element  = panels[name].element;
            panels[name] = null;

            $animate.leave(element).then(function() {
                updateLayout(null, containerId);
            });
        };          

        /**
         * Registers a panels container
         *
         * element : DOM element
         */
        this.registerContainer = function(container, containerId) {
            if (!containerId) {
                containerId = DEFAULT_CONTAINER_ID;
            }
            if (!containers[containerId]) {
                containers[containerId] = container;
                if (!panelsList[containerId]) {
                    return;
                }

                Object.keys(panelsList[containerId]).forEach(function (panelName) {
                    var panel = panelsList[containerId][panelName];
                    addToDom(panel, containerId);
                });
            }
        };



        var timerWindowResize = null;
        angular.element($window).on('resize', function() {
            if(timerWindowResize !== null) {
                $timeout.cancel(timerWindowResize);
            }
            timerWindowResize = $timeout(function() {
                updateLayout();
            }, 100);
        });         

        function getStylesFromCache(name, options) {
            var savedWidth = stylesCache[name];
            if (savedWidth) {
                return 'width: ' + savedWidth + 'px;';
            }

            return '';
        }

        function getTemplatePromise(options) {
            if (options.template || options.templateURL) {
                return $q.when(options.template);
            }

            return $http.get(options.templateUrl, {cache: $templateCache}).then(function (result) {
                return result.data;
            });
        }

       
        function updateLayout(element, container) {
            if (!container) {
                Object.keys(containers).map(function (id) {
                    updateLayout(null, containers[id]);
                });
                return this;
            }
            var panelElements = angular.element(container).children('.ev-panel');
            
            if (element) {
                for (var i = 0; i < panelElements.length; i++) {
                    var current = panelElements[i];
                    if (element == current) {
                        panelElements.splice(i, 1);
                        panelElements.push(element);
                        break;
                    }
                }
            }
            var containerWidth = container.parent().innerWidth();
            panelLayoutEngine.checkStacking(panelElements, containerWidth);
        }

        return this;
    }])
    .directive('evPanels', ['PanelService', function(panelService) {
        return {
            restrict: 'AE',
            scope: {},
            replace: true,
            template: '<div class="ev-panels-wrapper"><div class="ev-panels-container"></div></div>',
            link: function (scope, element, attrs) {
              panelService.registerContainer(element.children(), attrs.id);
            }
        };
    }]);
