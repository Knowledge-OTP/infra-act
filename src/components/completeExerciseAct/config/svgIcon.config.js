(function () {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .config(function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'complete-exercise-correct-icon': 'components/completeExerciseAct/svg/correct-icon.svg',
                'complete-exercise-wrong-icon': 'components/completeExerciseAct/svg/wrong-icon.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        });
})();

