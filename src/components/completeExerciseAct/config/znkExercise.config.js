(function () {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .config(function (QuestionTypesSrvProvider, exerciseTypeConst, CategoryServiceProvider, TestScoreCategoryEnumProvider) {
            'ngInject';

            function questionTypeGetter(question) {
                var templatesContants = {
                    SIMPLE_QUESTION: 0,
                    MATH_QUESTION: 1,
                    WRITING_SPECIFIC_PARAGRAPH: 2,
                    WRITING_FULL_PASSAGE: 3,
                    READING_QUESTION: 4,
                    ESSAY_QUESTION: 5,
                    LECTURE_QUESTION: 6
                };

                // lecture question or simple question.
                if ((angular.isDefined(question.exerciseTypeId) && question.exerciseTypeId === exerciseTypeConst.LECTURE) || (question.groupDataId === null && question.paragraph === null)) {
                    return question.exerciseTypeId === exerciseTypeConst.LECTURE ? templatesContants.LECTURE_QUESTION : templatesContants.SIMPLE_QUESTION;
                }

                var categoryService = CategoryServiceProvider.$get();
                var TestScoreCategoryEnum = TestScoreCategoryEnumProvider.$get();

                return categoryService.getCategoryLevel2Parent(question.categoryId).then(function (testScoreObj) {
                    switch (testScoreObj.id) {

                        case TestScoreCategoryEnum.MATH.enum:
                            return templatesContants.MATH_QUESTION;

                        case TestScoreCategoryEnum.WRITING.enum:
                            if (question.paragraph !== null && question.paragraph.length > 0) {
                                return templatesContants.WRITING_SPECIFIC_PARAGRAPH;
                            }
                            return templatesContants.WRITING_FULL_PASSAGE;

                        case TestScoreCategoryEnum.READING.enum:
                            return templatesContants.READING_QUESTION;

                        case TestScoreCategoryEnum.ESSAY.enum:
                            return templatesContants.ESSAY_QUESTION;

                        default:
                            return templatesContants.SIMPLE_QUESTION;
                    }
                });
            }

            QuestionTypesSrvProvider.setQuestionTypeGetter(questionTypeGetter);

            var map = {
                0: '<simple-question></simple-question>',
                1: '<math-question></math-question>',
                2: '<writing-specific-paragraph></writing-specific-paragraph>',
                3: '<writing-full-passage></writing-full-passage>',
                4: '<reading-question></reading-question>',
                5: '<essay-question></essay-question>',
                6: '<lecture-question></lecture-question>'
            };
            QuestionTypesSrvProvider.setQuestionTypesHtmlTemplate(map);
        })
        .config(function (ZnkExerciseSrvProvider, exerciseTypeConst) {
            'ngInject';

            var allowedTimeForQuestionByExercise = {};
            allowedTimeForQuestionByExercise[exerciseTypeConst.TUTORIAL] = 1.5 * 60 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.DRILL] = 40 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.PRACTICE] = 40 * 1000;
            ZnkExerciseSrvProvider.setAllowedTimeForQuestionMap(allowedTimeForQuestionByExercise);
        });
})();

