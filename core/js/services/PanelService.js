var module = angular.module('ev-fdm');

module
    .service('PanelService', [
        '$animate', '$q', '$http', '$templateCache', '$compile', '$rootScope', '$timeout', '$window', 'PanelLayoutEngine',
        function($animate, $q, $http, $templateCache, $compile, $rootScope, $timeout, $window, panelLayoutEngine) {

        var container = null,
            panels    = {},
            stylesCache = window.stylesCache = {};

        /**
         * Panel options are:
         * - name
         * - template or templateURL
         * - index
         */
        this.open = function(options) {
            if (!options.name && options.panelName) {
                console.log("Deprecated: use name instead of panelName")
                options.name = options.panelName;
            }

            if (!options) {
                console.log("A panel must have a name (options.name)");
                return;
            }

            if (panels[options.name]) {
                var panel        = panels[options.name];
                panel.index      = options.index;

                var afterIndex   = findAfterElementIndex(options.index),
                    afterElement = getAfterElement(afterIndex);

                panel.element.css('z-index', 2000 + afterIndex);
                $animate.move(panel.element, container, afterElement, function() {
                    updateLayout();
                });

                return panels[options.name];
            }

            // We call it *THE BEAST*.
            var element          = angular.element('<div class="panel-placeholder" ev-panel-breakpoints style="' + getStylesFromCache(options.name, options) + '"   ><div class="panel right" ><div class="panel-inner"><div class="panel-content"></div></div></div></div>'),
                templatePromises = getTemplatePromise(options);
            panels[options.name] = options;
            options.element      = element;
            options.element.css('z-index', 2000 + options.index);

            return templatePromises.then(function(template) {
                element.find('.panel-content').html(template);
                element          = $compile(element)($rootScope.$new());
                options.element  = element;

                var afterIndex   = findAfterElementIndex(options.index),
                    afterElement = getAfterElement(afterIndex);

                var timerResize = null;
                element.on('resize', function(event, ui) {
                    var self = this;
                    if (timerResize) {
                        $timeout.cancel(timerResize);
                    }
                    timerResize = $timeout(function() {
                        stylesCache[options.panelName] = ui.size.width;
                        updateLayout(self);
                    }, 100);
                });

                $animate.enter(element, container, afterElement, function() {
                    updateLayout();
                });

                return options;
            });
        };

        this.close = function(name) {
            if (!name || !panels[name]) {
                console.log("Panel not found for:" + name);
            }

            var element  = panels[name].element;
            panels[name] = null;

            $animate.leave(element, function() {
                updateLayout();
            })
        };

        /**
         * Registers a panels container
         *
         * element : DOM element
         */
        this.registerContainer = function(element) {
            container = element;
        };

        var timerWindowResize = null;
        angular.element($window).on('resize', function() {
            if(timerWindowResize !== null) {
                $timeout.cancel(timerWindowResize);
            }
            timerWindowResize = $timeout(function() {
                updateLayout()
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
                return $q.when(options.template)
            }

            return $http.get(options.templateUrl, {cache: $templateCache}).then(function (result) {
                return result.data;
            });
        }

        function findAfterElementIndex(index) {
            var insertedPanels = angular.element(container).children(),
                afterIndex     = index - 1;

            if (!index || index > insertedPanels.length) {
                afterIndex = insertedPanels.length - 1;
            }
            else if (index < 1) {
                afterIndex = 0;
            }

            return afterIndex;
        }

        function getAfterElement(afterIndex) {
            var insertedPanels = angular.element(container).children(),
                domElement     = insertedPanels[afterIndex];

            return domElement ? angular.element(domElement) : null;
        }

        function updateLayout(element) {
            var panelElements = angular.element(container).children('.panel-placeholder');

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
            panelLayoutEngine.checkStacking(panelElements);
        }

        return this;
    }])
    .directive('panels', ['PanelService', function(panelService) {
        return {
            restrict: 'AE',
            scope: {},
            replace: true,
            template: '<div class="panels panels-container lisette-module"><div></div></div>',
            link: function (scope, element, attrs) {
              panelService.registerContainer(element);
            }
        };
    }]);
