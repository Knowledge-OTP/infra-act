(function (angular) {
    'use strict';

    angular.module('znk.infra-act.completeExerciseAct')
        .directive('article',function articleDirective() {
            'ngInject';

            var directive = {
                templateUrl: 'components/completeExerciseAct/templates/article.template.html',
                scope: {
                    contentGetter: '&content',
                    deleteUnderScores: '&'
                },
                link: function(scope, element, attrs) {
                    function stringEndsWith(str, searchString) {
                        return str.indexOf(searchString, str.length - searchString.length) !== -1;
                    }

                    function injectLineNumbersToHtml(htmlString) {
                        var start = false;
                        var htmlParagraphs = htmlString.split(/<\s*p\s*>|<\s*p\s*\/\s*>/gi);
                        var j, i, ln = 0;
                        var res = '';
                        for (j = 0; j < htmlParagraphs.length; ++j) {
                            if (htmlParagraphs[j] === '') {
                                continue;
                            }

                            var htmlLines = htmlParagraphs[j].split(/<\s*br\s*>|<\s*br\s*\/\s*>/gi);
                            for (i = 0; i < htmlLines.length; ++i) {
                                if (htmlLines[i].match('_')) {
                                    htmlLines[i] = '<br><span class=\"indented-line\">' + htmlLines[i].replace('_', '') + '</span>';
                                    start = true;
                                }
                                if (!start) {
                                    continue;
                                }
                                ln += 1;
                                if (ln === 1 || ln % 5 === 0) {
                                    if (stringEndsWith(htmlLines[i], '</p>')) {
                                        var lastTagIndex = htmlLines[i].lastIndexOf('<');
                                        var lastTag = htmlLines[i].substr(lastTagIndex);
                                        var markupStart = htmlLines[i].substr(0, lastTagIndex);
                                        htmlLines[i] = markupStart + '<span class=\"num-article\">' + String(ln) + '</span>' + lastTag;
                                    } else {
                                        htmlLines[i] = htmlLines[i] + '<span class=\"num-article\">' + String(ln) + '</span>';
                                    }
                                }
                                htmlLines[i] = htmlLines[i] + '<br>';
                            }
                            res = res + '<p>' + htmlLines.join('') + '</p>';
                        }
                        return '<div class=\"wrap-num-article\">' + res + '</div>';
                    }

                    function arrayMarkups(contentArr) {
                        var markup = '';

                        angular.forEach(contentArr, function (item) {
                            if (item[attrs.markupField]) {
                                markup += item[attrs.markupField];
                            }
                        });

                        return markup;
                    }

                    var content = scope.contentGetter();

                    if (angular.isArray(content)) {
                        content = arrayMarkups(content);
                    }

                    if (content) {
                        content = content.replace(/font\-family: \'Lato Regular\';/g, 'font-family: Lato;font-weight: 400;');
                        if (scope.deleteUnderScores()) {
                            angular.element(element[0].querySelector('.article-content')).html(content.replace(/_/g, ''));
                        } else {
                            angular.element(element[0].querySelector('.article-content')).html(injectLineNumbersToHtml(content));
                        }
                    }
                }
            };

            return directive;
        });
})(angular);
