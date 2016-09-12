(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .config(function timelineConfig(TimelineSrvProvider, SubjectEnumConst) {
            'ngInject';

            TimelineSrvProvider.setColors({
                [SubjectEnumConst.MATH]: '#75CBE8',
                [SubjectEnumConst.READING]: '#F9D41B',
                [SubjectEnumConst.WRITING]: '#FF5895',
                [SubjectEnumConst.ENGLISH]: '#AF89D2',
                [SubjectEnumConst.SCIENCE]: '#51CDBA'
            });
        });
})(angular);
