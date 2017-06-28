(function (angular) {
    'use strict';

    angular.module('znk.infra-act.socialSharingAct')
        .config(function estimatedScoreConfig(EstimatedScoreSrvProvider, SubjectEnumConst,
                                              EstimatedScoreEventsHandlerSrvProvider, exerciseTypeConst) {

            var subjectsRawScoreEdges = {};
            subjectsRawScoreEdges[SubjectEnumConst.ENGLISH] = {
                min: 0,
                max: 75
            };
            subjectsRawScoreEdges[SubjectEnumConst.MATH] = {
                min: 0,
                max: 60
            };
            subjectsRawScoreEdges[SubjectEnumConst.READING] = {
                min: 0,
                max: 40
            };
            subjectsRawScoreEdges[SubjectEnumConst.SCIENCE] = {
                min: 0,
                max: 40
            };
            subjectsRawScoreEdges[SubjectEnumConst.WRITING] = {
                min: 0,
                max: 10
            };

            EstimatedScoreSrvProvider.setSubjectsRawScoreEdges(subjectsRawScoreEdges);

            EstimatedScoreSrvProvider.setMinMaxDiagnosticScore(-Infinity, Infinity);

            function rawScoreToScoreFnGetter(ScoringService) {
                'ngInject';

                return function (subjectId, rawScore) {
                    return ScoringService.rawScoreToScore(subjectId, rawScore);
                };
            }

            EstimatedScoreSrvProvider.setRawScoreToRealScoreFn(rawScoreToScoreFnGetter);

            var diagnosticScoringMap = {
                1: [4, 4, 3, 3],
                2: [5, 5, 4, 4],
                3: [6, 6, 5, 5],
                4: [7, 7, 6, 6],
                5: [10, 10, 7, 7]
            };
            EstimatedScoreEventsHandlerSrvProvider.setDiagnosticScoring(diagnosticScoringMap);
            // 1st pos = correct within allowed time, 2nd pos = correct outside allowed time , 3ed pos = wrong within allowed time, 4th pos = wrong outside allowed time
            var exerciseRawPoints = [1, 1, 0, 0];
            var sectionRawPoints = [1, 0, 0, 0];
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.SECTION, sectionRawPoints);
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.TUTORIAL, exerciseRawPoints);
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.GAME, exerciseRawPoints);
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.PRACTICE, exerciseRawPoints);
            var drillRawPointsForExercise = [0.2, 0.2, 0, 0];
            EstimatedScoreEventsHandlerSrvProvider.setExerciseRawPoints(exerciseTypeConst.DRILL, drillRawPointsForExercise);
        });
})(angular);
