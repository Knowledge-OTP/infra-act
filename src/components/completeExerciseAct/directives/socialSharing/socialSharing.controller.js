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
                subjectMap[SubjectEnum.ENGLISH.enum] = 'english';
                subjectMap[SubjectEnum.READING.enum] = 'reading';
                subjectMap[SubjectEnum.SCIENCE.enum] = 'science';
                subjectMap[SubjectEnum.WRITING.enum] = 'writing';

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
                        var image = $window.location.protocol + ENV.zinkerzWebsiteShareImgUrl + sharingData.shareUrlMap[self.subjectName];
                        var descriptionTranslate = sharingData.isImproved ? 'IMPROVED_TEXT' : 'SHARE_DESCRIPTION';
                        var description = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.' + descriptionTranslate, { pts: sharingData.points, subjectName: self.subjectName });
                        var title = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_TITLE');
                        var caption = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_CAPTION');
                        var hashtags = translateFilter('SOCIAL_SHARING_CONTAINER_DRV.SHARE_HASHTAGS');
                        var shareUrl =  $window.location.protocol + ENV.zinkezWebsiteUrl;

                        self.shareData = {};                        
                        self.shareData.facebook = {
                            type: 'facebook',
                            display: 'popup',
                            link: shareUrl,
                            picture: image,
                            caption: caption,
                            description: description,
                            app_id: ENV.facebookAppId,
                            name: title
                        };

                        self.shareData.google = {
                            url: shareUrl,
                        };

                        self.shareData.twitter = {
                            type: 'twitter',
                            url: shareUrl,
                            text: description,
                            hashtags: hashtags
                        };
                    }
                });
            });
})(angular);
