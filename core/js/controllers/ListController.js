angular.module('ev-fdm')
    .factory('ListController', ['$rootScope', '$state', '$stateParams', 'Restangular', function($rootScope, $state, $stateParams, restangular) {

        function ListController($scope, elementName, elements, defaultSortKey, defaultReverseSort, activeIdSelector) {
            var self = this;

            if (typeof elementName === 'object') {
                defaultReverseSort = elementName.defaultReverseSort;
                defaultSortKey = elementName.defaultSortKey;
                elements = elementName.elements;
                activeIdSelector = elementName.activeIdSelector || 'id';
                elementName = elementName.elementName;
            }

            /*
                Properties
             */
            this.$scope = $scope;
            this.elementName = elementName;
            this.elements = elements;
            this.defaultSortKey = defaultSortKey;
            this.defaultReverseSort = defaultReverseSort;
            this.sortKey = this.defaultSortKey;
            this.reverseSort = this.defaultReverseSort;
            this.activeIdSelector = activeIdSelector || 'id';

            this.updateScope();

            /*
                Pagination method that should be called from the template
             */
            this.$scope.changePage = function(newPage) {

                var eventArgs = angular.copy(arguments);

                Array.prototype.unshift.call(eventArgs, 'common::pagination.changed', self.$scope.currentPage, newPage);
                $rootScope.$broadcast.apply($rootScope, eventArgs);
                self.update(newPage, self.filters, self.sortKey, self.reverseSort);
            };

            /*
                Sort method that should be called from the template
             */
            this.$scope.sortChanged = function() {
                self.sortKey = self.$scope.sortKey;
                self.reverseSort = self.$scope.reverseSort;

                var eventArgs = angular.copy(arguments);

                Array.prototype.unshift.call(eventArgs, 'common::sort.changed', self.sortKey, self.reverseSort);
                $rootScope.$broadcast('common::sort.changed', self.sortKey, self.reverseSort);
                $rootScope.$broadcast.apply($rootScope, eventArgs);

                self.update(1, self.filters, self.sortKey, self.reverseSort);
            };

            /*
                Display an item by changing route
             */
            this.$scope.toggleDetailView = function(element) {
                self.toggleView('view', element);
            };

            /*
             * Update the view when filter are changed in the SearchController
             */
            $scope.$on('common::filters.changed', function(event, filters) {
                this.filters = filters;
                this.sortKey = this.defaultSortKey;
                this.update(1, this.filters, this.sortKey, this.reverseSort);
            }.bind(this));

            /*
                When returning to the list state remove the active element
             */
            this.$scope.$on('$stateChangeSuccess', function(event, toState) {
                if(toState.name === self.elementName) {
                    self.$scope.activeElement = null;
                }
                else {
                    self.setActiveElement();
                }
            });

            $scope.$on(this.elementName + '::updated', function(event) {
                self.update(self.$scope.currentPage, self.filters, self.sortKey, self.reverseSort);
            });

            $scope.$on(this.elementName + '::created', function(event) {
                self.update(self.$scope.currentPage, self.filters, self.sortKey, self.reverseSort);
            });

            $scope.$on(this.elementName + '::deleted', function(event) {
                self.update(self.$scope.currentPage, self.filters, self.sortKey, self.reverseSort);
            });
        }

        ListController.prototype.update = function(page, filters, sortKey, reverseSort) {
            this.fetch(page, filters, sortKey, reverseSort).then(function(elements) {
                this.elements = elements;
                this.updateScope();
            }.bind(this));
        };

        ListController.prototype.updateScope = function () {
            this.$scope[this.elementName] = this.elements;
            this.$scope.currentPage = this.elements.pagination.current_page;
            this.$scope.pageCount = this.elements.pagination.total_pages;
            this.$scope.totalElement = this.elements.pagination.total;
            this.$scope.sortKey = this.sortKey;
            this.$scope.reverseSort = this.reverseSort;

            if (!this.$scope.selectedElements || !this.elements) {
                this.$scope.selectedElements = [];
            } else {
                var selectedElementsIds = this.elements.map(function(elt) {
                    return restangular.configuration.getIdFromElem(elt);
                });
                this.$scope.selectedElements = this.$scope.selectedElements.filter(function(elt) {
                    return selectedElementsIds.indexOf(restangular.configuration.getIdFromElem(elt)) !== -1;
                });
            }
            this.setActiveElement();
        };

        ListController.prototype.setActiveElement = function() {
            var self = this;
            this.$scope.activeElement = null;

            if(angular.isDefined($state.params[this.activeIdSelector])) {
                angular.forEach(this.elements, function(element) {
                    var elementId = restangular.configuration.getIdFromElem(element);
                    if (elementId == $state.params[self.activeIdSelector]) {
                        self.$scope.activeElement = element;
                    }
                });
            }
        };

        ListController.prototype.toggleView = function(view, element, routingArgs) {

            if (!element) {
                $rootScope.$broadcast('common::list.toggleView', view, 'close');
                $state.go(this.goToViewStatePath(false));
                return;
            }

            var id = restangular.configuration.getIdFromElem(element);

            if (!id || $stateParams.id === id) {
                $rootScope.$broadcast('common::list.toggleView', view, 'close');
                $state.go(this.goToViewStatePath(false));
            }
            else {
                var params = {};
                params[this.activeIdSelector] = id;

                angular.extend(params, routingArgs);

                $rootScope.$broadcast('common::list.toggleView', view, 'open');

                $state.go(this.goToViewStatePath(view, element), params);
            }
        };

        ListController.prototype.goToViewStatePath = function(view, element) {
            return this.elementName + (view ? '.' + view : '');
        };

        return ListController;
    }]);
