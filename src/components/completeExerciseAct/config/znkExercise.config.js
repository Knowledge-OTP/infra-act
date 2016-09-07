(function () {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .config(function (QuestionTypesSrvProvider, exerciseTypeConst, SubjectEnumConst) {
            'ngInject';

            function questionTypeGetter(question) {
                var templatesContants = {
                    SIMPLE_QUESTION: 0,
                    MATH_QUESTION: 1,
                    READING_QUESTION: 2,
                    WRITING_QUESTION: 3,
                    ENGLISH_SPECIFIC_PARAGRAPH: 4,
                    ENGLISH_FULL_PARAGRAPHS: 5,
                    SCIENCE_QUESTION: 6,
                    LECTURE_QUESTION: 7
                };

                // lecture question or simple question.
                if ((angular.isDefined(question.exerciseTypeId) && question.exerciseTypeId === exerciseTypeConst.LECTURE) || (question.groupDataId === null && question.paragraph === null)) {
                    return question.exerciseTypeId === exerciseTypeConst.LECTURE ? templatesContants.LECTURE_QUESTION : templatesContants.SIMPLE_QUESTION;
                }

                switch (question.subjectId) {

                    case SubjectEnumConst.MATH:
                        return templatesContants.MATH_QUESTION;

                    case SubjectEnumConst.READING:
                        return templatesContants.READING_QUESTION;

                    case SubjectEnumConst.WRITING:
                        return templatesContants.WRITING_QUESTION;

                    case SubjectEnumConst.ENGLISH:
                        if (question.paragraph !== null && question.paragraph.length > 0) {
                            return templatesContants.ENGLISH_SPECIFIC_PARAGRAPH;
                        }
                        return templatesContants.ENGLISH_FULL_PARAGRAPHS;
                    case SubjectEnumConst.SCIENCE:
                        return templatesContants.SCIENCE_QUESTION;
                    default:
                        return templatesContants.SIMPLE_QUESTION;
                }
            }

            QuestionTypesSrvProvider.setQuestionTypeGetter(questionTypeGetter);

            var map = {
                0: '<simple-question></simple-question>',
                1: '<math-question></math-question>',
                2: '<reading-question></reading-question>',
                3: '<writing-question></writing-question>',
                4: '<english-specific-paragraph></english-specific-paragraph>',
                5: '<english-full-paragraphs></english-full-paragraphs>',
                6: '<science-question></science-question>',
                7: '<lecture-question></lecture-question>'
            };
            QuestionTypesSrvProvider.setQuestionTypesHtmlTemplate(map);
        })
        .config(function (ZnkExerciseAnswersSrvProvider, ZnkExerciseSrvProvider, exerciseTypeConst) {
            'ngInject';

            function selectAnswerIndexFormatter(answerIndex, question) {
                var isOddQuestion = angular.isUndefined(question.__questionStatus.index % 2) ? false : (question.__questionStatus.index % 2);
                if (isOddQuestion) {
                    var I_CHAR_INDEX = 3;
                    if (answerIndex >= I_CHAR_INDEX) {
                        answerIndex++;//  i char should be skipped
                    }
                    var UPPER_F_ASCII_CODE = 70;
                    var formattedAnswerIndex = String.fromCharCode(UPPER_F_ASCII_CODE + answerIndex);
                    return formattedAnswerIndex;
                }
            }

            ZnkExerciseAnswersSrvProvider.config.selectAnswer.setAnswerIndexFormatter(selectAnswerIndexFormatter);

            var allowedTimeForQuestionByExercise = {};
            allowedTimeForQuestionByExercise[exerciseTypeConst.TUTORIAL] = 1.5 * 60 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.DRILL] = 40 * 1000;
            allowedTimeForQuestionByExercise[exerciseTypeConst.PRACTICE] = 40 * 1000;
            ZnkExerciseSrvProvider.setAllowedTimeForQuestionMap(allowedTimeForQuestionByExercise);
        });
})();

