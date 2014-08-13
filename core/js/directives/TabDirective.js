(function () {
    'use strict';
    angular.module('ev-fdm')
        .directive('evTab', function () {
            return {
                restrict: 'E',
                transclude: true,
                scope: {},
                controller: function($scope, $element) {
                    var panes = $scope.panes = [];


                    $scope.select = function(pane) {
                        angular.forEach(panes, function(pane) {
                            pane.selected = false;
                        });
                        pane.selected = true;
                    };


                    this.addPane = function(pane) {
                        if (panes.length === 0) { $scope.select(pane); }
                        panes.push(pane);
                    };

                    var selectFuture = function (panes) {
                        var futurePane;
                        panes.some(function (pane) {
                            var isSelected = $scope.isShowed(pane);
                            if (isSelected) {
                                futurePane = pane;
                            }
                            return isSelected;
                        });
                       return futurePane;
                    };

                    this.selectNext = function() {
                        var selectedIndex = $scope.selectedIndex();
                        var nextPanes = panes.slice(selectedIndex + 1);
                        $scope.select(selectFuture(nextPanes) || panes[selectedIndex]);
                    };

                    this.selectPrevious = function() {
                        var selectedIndex = $scope.selectedIndex();
                        var previousPanes = panes.slice(0, selectedIndex).reverse();
                        $scope.select(selectFuture(previousPanes) || panes[selectedIndex]);
                    };

                    $scope.selectedIndex = function() {
                        for (var i = 0; i < panes.length; i++) {
                            var pane = panes[i];

                            if (pane.selected) {
                                return i;
                            }
                        }
                    };

                    $scope.isShowed = function (pane) {
                        return pane.tabShow == null || !!pane.tabShow;
                    };
                },
                template:
                    '<div class="tabbable" ev-fixed-header refresh-on="tab_container">' +
                        '<ul class="nav nav-tabs ev-header">' +
                            '<li ng-repeat="pane in panes | filter:isShowed" ' +
                                'ng-class="{active:pane.selected}" '+
                                'tooltip="{{pane.tabTitle}}" tooltip-placement="bottom" tooltip-append-to-body="true">'+
                                '<a href="" ng-click="select(pane); pane.tabClick()"> ' +
                                    '<span ng-show="pane.tabIcon" class="{{pane.tabIcon}}"></span> '+
                                    '<span ng-hide="pane.tabIcon">{{pane.tabTitle}}</span>'+
                                '</a>' +
                            '</li>' +
                        '</ul>' +
                        '<div class="tab-content ev-body" ng-transclude></div>' +
                    '</div>',
                replace: true
            };
        })
        .directive('evPane', function() {
            return {
                require: '^evTab',
                restrict: 'E',
                transclude: true,
                scope: {
                    tabTitle: '@',
                    tabIcon: '@',
                    tabClick: '&',
                    tabShow: '='
                },
                link: function(scope, element, attrs, tabsCtrl, transcludeFn) {
                    tabsCtrl.addPane(scope);
                    transcludeFn(function(clone, transcludedScope) {
                        transcludedScope.$selectNext     = tabsCtrl.selectNext;
                        transcludedScope.$selectPrevious = tabsCtrl.selectPrevious;

                        element.find('.transclude').append(clone);
                    });
                },
                template:
                    '<div class="tab-pane" ng-class="{active: selected}">' +
                        '<div class="section transclude"></div>' +
                    '</div>',
                replace: true
            };
        });
}) ();