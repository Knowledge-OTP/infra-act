(function () {
    'use strict';

    angular.module('znk.infra.exerciseUtility')
        .decorator('categoryEnum', function ($delegate) {
            'ngInject';
            $delegate.LEVEL1.enum = 9;
            $delegate.LEVEL2.enum = 11;
            $delegate.LEVEL3.enum = 6;
            $delegate.LEVEL3.enum = 7;
            
            return $delegate;
        });
})();
