(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .controller('SocialSharingController',
            function (SocialSharingSrv, $filter, SubjectEnum, ENV, $window) {
                'ngInject';

                var self = this;
                var translateFilter = $filter('translate');
                self.showSocialArea = false;

                var subjectMap = {};
                subjectMap[SubjectEnum.MATH.enum] = 'math';
                subjectMap[SubjectEnum.VERBAL.enum] = 'verbal';

                // return if subjectId is in excludeArr
                if (self.excludeArr && angular.isArray(self.excludeArr)) {
                    for (var i = 0, ii = self.excludeArr.length; i < ii; i++) {
                        if (self.subjectId === self.excludeArr[i]) {
                            return;
                        }
                    }
                }

                SocialSharingSrv.getSharingData(self.subjectId).then(function (sharingData) {
                    self.showSocialArea = sharingData;

                    if (sharingData) {
                        self.subjectName = subjectMap[self.subjectId];
                        var image = $window.location.protocol + ENV.zinkerzWebsiteBaseUrl + 'wp-content/themes/salient-child/images/share/' + sharingData.shareUrlMap[self.subjectName];
                        var descriptionTranslate = sharingData.isImproved ? 'IMPROVED_TEXT' : 'SHARE_DESCRIPTION';
                        var description = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.' + descriptionTranslate, {
                            pts: sharingData.points,
                            subjectName: self.subjectName
                        });
                        var title = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_TITLE');
                        var caption = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_CAPTION');
                        var url = ENV.zinkezWebsiteUrl;
                        var ogPrefix = 'og:';
                        var twitterPrefix = 'twitter:';


                        self.shareData = {
                            facebook: {
                                type: 'facebook',
                                facebookurl: url,
                                facebooktitle: title
                            }
                        };
                        self.shareData.facebook[ogPrefix + 'image'] = image;
                        self.shareData.facebook[ogPrefix + 'image:width'] = 484;
                        self.shareData.facebook[ogPrefix + 'image:height'] = 252;
                        self.shareData.facebook[ogPrefix + 'title'] = title;
                        self.shareData.facebook[ogPrefix + 'caption'] = caption;
                        self.shareData.facebook[ogPrefix + 'description'] = description;
                        self.shareData.facebook['fb:app_id'] = ENV.facebookAppId;

                        self.shareData.google = {
                            type: 'google',
                            url: url,
                            title: title,
                            description: description,
                            image: image
                        };


                        self.shareData.google [ogPrefix + 'image'] = image;
                        self.shareData.google [ogPrefix + 'image:width'] = 484;
                        self.shareData.google [ogPrefix + 'image:height'] = 252;
                        self.shareData.google [ogPrefix + 'title'] = title;
                        self.shareData.google [ogPrefix + 'description'] = description;
                        self.shareData.google [ogPrefix + 'url'] = url;

                        self.shareData.twitter = {
                            type: 'twitter',
                            description: description,
                            url: url,
                            title: title
                        };
                        self.shareData.twitter[twitterPrefix + 'card'] = 'summary_large_image';
                        self.shareData.twitter[twitterPrefix + 'description'] = description;
                        self.shareData.twitter[twitterPrefix + 'site'] = '@oded300';
                        self.shareData.twitter[twitterPrefix + 'title'] = title;
                        self.shareData.twitter[twitterPrefix + 'image'] = image;
                        self.shareData.twitter[twitterPrefix + 'url'] = url;
                    }
                });
            });
})(angular);
