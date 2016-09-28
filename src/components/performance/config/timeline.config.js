(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .config(function timelineConfig(TimelineSrvProvider, SubjectEnumConst) {
            'ngInject';
            var keys = {};

            keys[SubjectEnumConst.MATH] = '#75CBE8';
            keys[SubjectEnumConst.READING] = '#F9D41B';
            keys[SubjectEnumConst.WRITING] = '#FF5895';
            keys[SubjectEnumConst.ENGLISH] = '#AF89D2';
            keys[SubjectEnumConst.SCIENCE] = '#51CDBA';

            TimelineSrvProvider.setColors(keys);
        });
})(angular);
