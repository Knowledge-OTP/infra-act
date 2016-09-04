(function (angular) {
    'use strict';

    angular.module('znk.infra-act.performance')
        .run(function($timeout, $translatePartialLoader){
            'ngInject';

            $timeout(function(){
                $translatePartialLoader.addPart('performance');
            });
        });
})(angular);
