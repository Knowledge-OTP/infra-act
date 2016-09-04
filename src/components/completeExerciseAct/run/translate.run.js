(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .run(function($timeout, $translatePartialLoader){
            'ngInject';

            $timeout(function(){
                $translatePartialLoader.addPart('completeExerciseAct');
            });
        });
})(angular);
