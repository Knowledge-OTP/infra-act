(function () {
    'use strict';

    angular.module('znk.infra-act.configAct')
        .decorator('CategoryService', function ($delegate) {
            'ngInject';

            var relevantSubjects = ['ENGLISH', 'MATH', 'READING', 'SCIENCE', 'WRITING'];
            angular.forEach($delegate, function (value, key) {
                if (relevantSubjects.indexOf(key) === -1) {
                    delete $delegate[key];
                }
            });
            return $delegate;
        });
})();
