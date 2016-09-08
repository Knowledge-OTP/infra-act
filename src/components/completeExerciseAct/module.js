(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct', [
        'znk.infra-web-app.completeExercise',
        'znk.infra.znkExercise',
        'znk.infra.contentGetters',
        'znk.infra.estimatedScore',
        'znk.infra-act.exerciseUtilityAct',
        'znk.infra-act.examUtility',
        'znk.infra-act.socialSharingAct',
        'chart.js',
        'znk.infra-act.performance',
        'znk.infra.hint'
    ]);
})(angular);
