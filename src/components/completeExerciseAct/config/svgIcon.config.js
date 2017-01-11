(function () {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .config(function (SvgIconSrvProvider) {
            'ngInject';

            var svgMap = {
                'complete-exercise-correct-icon': 'components/completeExerciseAct/svg/correct-icon.svg',
                'complete-exercise-wrong-icon': 'components/completeExerciseAct/svg/wrong-icon.svg',
                'znk-app-name-logo':'components/configAct/svg/znk-app-name-logo.svg'
            };
            SvgIconSrvProvider.registerSvgSources(svgMap);
        });
})();

