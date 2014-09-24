angular.module('ev-leaflet', ['leaflet-directive'])
    .provider('evLeaflet', function() {
        this.$get =function () {
            return {icons: this.icons};
        };

        this.setIcons =function (icons) {
            this.icons = icons;
        };
    })
    .directive('evLeaflet', ['leafletData', 'evLeaflet', '$log', function (leafletData, evLeaflet, $log) {
        return {
            template: '<leaflet class="ev-leaflet" defaults="defaults" markers="markers" center="mapCenter"></leaflet>',
            restrict: 'AE',
            scope: {
                center: '=',
                marker: '=',
                editable: '=',
                defaultZoom: '='
            },
            controller: function ($scope) {

                // Icons settings
                var baseIcon = {
                    iconSize:   [40, 40],
                    shadowSize: [1, 1],
                    iconAnchor: [1, 20]
                };

                var icons = evLeaflet.icons;

                if ('default' in icons) {
                    angular.extend(icons.default, baseIcon);
                }
                if ('draggable' in icons) {
                    angular.extend(icons.draggable, baseIcon);
                }


                $scope.defaults = {
                    scrollWheelZoom: false,
                    doubleClickZoom: false
                };

                // Setting a marker in location
                $scope.markers = {
                    marker: {
                        focus: true
                    }
                };
                centerOnMarker();

                // Double binding between coordinate and marker's position
                $scope.$watch('marker.latitude', function (lat) {
                    if (isNaN(lat)) {
                        $log.warn('ev-leaflet: latitude is not a number');
                    } else {
                        $scope.markers.marker.lat = lat;
                        centerOnMarker();
                    }
                });

                $scope.$watch('marker.longitude', function (lng) {
                    if (isNaN(lng)) {
                        $log.warn('ev-leaflet: longitude is not a number');
                    } else {
                        $scope.markers.marker.lng = lng;
                        centerOnMarker();
                    }
                });

                $scope.$watch('markers.marker.lat', function (lat) {
                    $scope.coordinate.latitude = lat;
                });

                $scope.$watch('markers.marker.lng', function (lng) {
                    $scope.coordinate.longitude = lng;
                });

                // Setting map center
                function centerOnMarker() {
                    if ($scope.center) {
                        $scope.mapCenter = {
                            lat: $scope.center.latitude,
                            lng: $scope.center.longitude,
                            zoom: $scope.defaultZoom || 8
                        };
                    } else {
                        $scope.mapCenter = {
                            lat: $scope.markers.marker.lat,
                            lng: $scope.markers.marker.lng,
                            zoom: $scope.defaultZoom || 8
                        };
                    }
                }

                $scope.$watch('editable', function () {
                    var edited = $scope.editable;
                    $scope.markers.marker.icon = edited ? icons.draggable : icons['default'];
                    $scope.markers.marker.draggable = edited;
                });
            }
        };
    }]);
