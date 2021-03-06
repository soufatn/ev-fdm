; (function () {
'use strict';
angular.module('ev-upload')
    .directive('evPictureButtonUpload', ['NotificationsService', '$http', function (NotificationsService, $http) {

/*  ev-picture-button-upload
    =================
    Hi! I'm a directive used for uploading pictures but I'm just a button.
    If you want a more advanced one, you can use the evPictureUpload

    You can parameter me with:
    - `url`:  which is the place where I'll upload the pictures
    - `pictureSuccess`:  a function called each time a picture has successfully been uploaded (by flickr
        or manually). The picture is passed as argument.

*/
        return {
            restrict: 'AE',
            scope: {
                pictures: '=',
                buttonText: '@',
                tooltipText: '@',
                iconName: '@',
                url: '@',
                language: '=',
                maxFiles: '@',
                addPicture: '&',
                onPictureAdded: '&'
            },
            template:
            '<ev-upload settings="settings" file-success="addPicture({picture: file})"' +
                'upload="newUpload(promise)">' +
                '<div ng-hide="uploading">' +
                    '<button type="button" tabIndex="-1" class="btn btn-tertiary btn-lime ev-upload-clickable"' +
                            'tooltip="{{tooltipText}}"' +
                            'tooltip-placement="top">' +
                        '<span class="icon {{iconName}}"></span>' +
                       '{{buttonText}}' +
                    '</button>' +
                '</div>' +
                '<div class="ev-picture-uploading" ng-show="uploading">' +
                    '<div class="ev-picture-upload-label"> {{"Transfert en cours"| i18n}} </div>' +
                    '<p> {{upload.done}} / {{upload.total}} </p>' +
                '</div>' +
                '<div ng-show="uploading" ev-promise-progress="uploadPromise"></div>' +
            '</ev-upload>',

            link: function ($scope, elem, attrs) {
                $scope.uploading = false;

                $scope.settings = {
                    acceptedFiles: 'image/*',
                    url: $scope.url,
                    maxFiles: $scope.maxFiles || 100
                };

                $scope.pictures = $scope.pictures || [];

                $scope.$watch('url', function (url) {
                    $scope.settings.url = url;
                });

                $scope.newUpload = function (upload) {
                    $scope.upload = {
                        done: 0,
                        total: '?'
                    };
                    $scope.uploading = true;
                    $scope.uploadPromise = upload;
                    upload
                        .then(
                            function success () {
                                NotificationsService.addSuccess({
                                    text: 'Les images ont été transférées avec succès'
                                });
                            },
                            function error () {
                                NotificationsService.add({
                                    type: NotificationsService.type.WARNING,
                                    text: 'Certaines images n\'ont pas pu être transférées.'
                                });
                            },
                            function onNotify (progress) {
                                $scope.upload = progress;
                            }
                        )
                        .finally(function () {
                            $scope.uploading = false;
                        });
                };

                // This allow us to override the add picture
                if(!attrs.addPicture) {
                    $scope.addPicture = function(picture) {
                        picture = picture.picture;
                        var pictureData = picture.data[0];
                        if($scope.language) {
                            if (Array.isArray(pictureData.legend)) {
                                pictureData.legend = {};
                            }
                            if (!pictureData.legend[$scope.language]) {
                                pictureData.legend[$scope.language] = { name: '' };
                            }
                        }

                        $scope.pictures.unshift(pictureData);
                        $scope.onPictureAdded();
                    };
                }
            }
        };
}]);
}) ();
