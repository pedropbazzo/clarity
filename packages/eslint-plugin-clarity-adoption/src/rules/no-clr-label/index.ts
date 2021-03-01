import { ESLintUtils, TSESTree } from '@typescript-eslint/experimental-utils';
import { RuleContext } from '@typescript-eslint/experimental-utils/dist/ts-eslint';
import { HTMLElement } from '../../types/index';
import { lintDecoratorTemplate } from '../decorator-template-helper';
import { getDeprecatedClassFixes, getTagFixes, insertTextAfterNode, removeAttribute } from '../html-fixer-helpers';

export const createESLintRule = ESLintUtils.RuleCreator(() => ``);
export type MessageIds = 'clrLabelFailure';

const deprecatedClassToAttributeMap = {
  // remove extraneous label and clickable classes
  label: '',
  clickable: '',

  'label-info': 'status="info"',
  'label-success': 'status="success"',
  'label-warning': 'status="warning"',
  'label-danger': 'status="danger"',

  'label-purple': 'color="purple"',
  'label-blue': 'color="blue"',
  'label-orange': 'color="orange"',
  'label-light-blue': 'color="light-blue"',
};

const disallowedClass = 'label';
const disallowedLabelElementSelector = `.${disallowedClass}`;

function lintLabelElement(context: RuleContext<any, any>, node: HTMLElement): void {
  const classNode = node.attributes?.find(attribute => attribute.attributeName.value === 'class');
  const classes = classNode?.attributeValue?.value?.split(' ') || [];
  if (classes.includes(disallowedClass)) {
    context.report({
      node: node as any,
      messageId: 'clrLabelFailure',
      fix: fixer => {
        const tagFixes = getTagFixes(fixer, node, node.tagName, 'cds-tag');
        const attributeFixes = getDeprecatedClassFixes(fixer, classNode, deprecatedClassToAttributeMap);

        if (classes.includes('clickable')) {
          const hrefNode = node.attributes?.find(attribute => attribute.attributeName.value === 'href');
          if (hrefNode) {
            const hrefNodeFix = removeAttribute(hrefNode, fixer);
            attributeFixes.push(hrefNodeFix);
          }
        } else {
          const readonlyTagAttributeFix = insertTextAfterNode(classNode!, 'readonly', fixer);
          attributeFixes.push(readonlyTagAttributeFix);
        }

        return [...tagFixes, ...attributeFixes];
      },
    });
  }
}

export default createESLintRule({
  name: 'no-clr-label',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow use of clr-label',
      category: 'Best Practices',
      recommended: 'warn',
    },
    fixable: 'code',
    messages: {
      clrLabelFailure: 'Using clr-label is not allowed!',
    },
    schema: [{}],
  },
  defaultOptions: [{}],
  create(context) {
    return {
      'HTMLElement[tagName="span"]'(node: HTMLElement): void {
        lintLabelElement(context, node);
      },
      'HTMLElement[tagName="a"]'(node: HTMLElement): void {
        lintLabelElement(context, node);
      },
      'ClassDeclaration > Decorator'(node: TSESTree.Decorator): void {
        lintDecoratorTemplate(context, node, disallowedLabelElementSelector, 'clrLabelFailure');
      },
    };
  },
});
