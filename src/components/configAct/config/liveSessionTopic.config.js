(function (angular) {
    'use strict';

    angular.module('znk.infra-act.configAct')
        .config(function (LiveSessionSubjectSrvProvider, LiveSessionSubjectConst) {
            'ngInject';
            var topics = [LiveSessionSubjectConst.MATH, LiveSessionSubjectConst.ENGLISH];
            LiveSessionSubjectSrvProvider.setLiveSessionTopics(topics);

        });
})(angular);
