(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .service('completeExerciseActSrv', function ($q, $log, ExerciseTypeEnum, ExerciseResultSrv, ExamSrv) {
            'ngInject';

            this.mergedTestScoresIfCompleted = function (exam, examResult, questionsData, resultsData) {
                if (!exam || !questionsData || !resultsData || !examResult) {
                    var errMsg = 'completeExerciseActSrv combinedSections:' +
                        'one or more of the arguments is missing!';
                    $log.error(errMsg, 'arguments:', arguments);
                    return $q.reject(errMsg);
                }
                resultsData = angular.copy(resultsData);
                questionsData = angular.copy(questionsData);
                var examId = exam.id;
                var subjectId = questionsData.subjectId;
                var currentSectionId = questionsData.id;
                var sectionResults = examResult.sectionResults;
                var sectionProms = [];
                var getOtherSections = exam.sections.filter(function (section) {
                    return section.subjectId === subjectId && currentSectionId !== section.id;
                });
                angular.forEach(getOtherSections, function (sectionBySubject) {
                    var sectionKey = sectionResults[sectionBySubject.id];
                    if (sectionKey) {
                        var exerciseResultProm = ExerciseResultSrv.getExerciseResult(ExerciseTypeEnum.SECTION.enum, sectionBySubject.id, examId, null, true);
                        var examSectionProm = ExamSrv.getExamSection(sectionBySubject.id);
                        sectionProms.push(exerciseResultProm);
                        sectionProms.push(examSectionProm);
                    }
                });
                if (sectionProms.length === 0) {
                    return $q.when(false);
                }
                return $q.all(sectionProms).then(function (results) {
                    var lengthResults = 0;
                    angular.forEach(results, function (result, index) {
                        if (result.isComplete) {
                            questionsData.questions = questionsData.questions.concat(results[index + 1].questions);
                            resultsData.questionResults = resultsData.questionResults.concat(result.questionResults);
                            lengthResults += 2;
                        }
                    });
                    if (results.length !== lengthResults) {
                        return $q.when(false);
                    }
                    return {
                        questionsData: questionsData,
                        resultsData: resultsData
                    };
                });
            };
        });
})(angular);
