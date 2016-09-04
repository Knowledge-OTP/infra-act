(function(angular){
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('socialSharing',function(){
            'ngInject';

            var directive = {
                scope: {
                    subjectId: '=',
                    excludeArr: '=?',
                    animate: '=?'
                },
                restrict: 'E',
                templateUrl: 'components/completeExerciseAct/directives/socialSharing/socialSharing.template.html',
                controller: 'SocialSharingController',
                bindToController: true,
                controllerAs: 'vm'
            };

            return directive;
        });
})(angular);
