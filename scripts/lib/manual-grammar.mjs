/**
 * Hand-authored tree-sitter rules that cannot be derived reliably from pest alone.
 */

export function manualGrammarSections() {
  return {
    preamble: `/** @type {import('tree-sitter-cli/dsl').Precedence[]} */
const PREC = {
  assignment: 1,
  logical_or: 2,
  logical_and: 3,
  equality: 4,
  comparison: 5,
  additive: 6,
  multiplicative: 7,
  unary: 8,
  postfix: 9,
  primary: 10,
};`,

    lexicalAndProgram: `
    source_file: $ => repeat($.item_with_docs),

    item_with_docs: $ => seq(
      optional($.doc_comment),
      $._item,
    ),

    _item: $ => choice(
      $.host_definition,
      $.macro_definition,
      $.function_definition,
      $.impl_block,
      $.extend_type_definition,
      $.type_definition,
      $.enum_definition,
      $.contract_definition,
      $.test_definition,
      $.attribute_declaration,
      $.inline_module,
      $.module_declaration,
      $.use_declaration,
    ),

    doc_comment: _ => token(repeat1(seq('///', /[^/\\n].*/, /\\n?/))),

    line_comment: _ => token(choice(
      seq('////', /.*/),
      seq('//', /[^/\\n]/, /.*/),
    )),

    block_comment: _ => token(seq(
      '/*',
      repeat(choice(/[^*]/, seq('*', /[^/]/))),
      '*/',
    )),

    identifier: _ => {
      const word = /[a-zA-Z_][a-zA-Z0-9_]*/;
      return token(prec(-1, word));
    },
`,

    types: `
    _type: $ => choice(
      $.arrow_function_type,
      $.function_type,
      $.type_reference,
      $.array_type,
      $._type_name,
    ),

    _type_name: $ => choice($.primitive_type, alias($._type_path, $.type_path)),

    type_path: $ => $._type_path,

    _type_path: $ => sep1($._type_path_segment, '.'),

    _type_path_segment: $ => seq(
      field('name', $.identifier),
      optional($.generic_arguments),
    ),
`,

    expressions: `
    _expression: $ => choice(
      $.lambda_expression,
      $.match_expression,
      $.assignment_expression,
    ),

    lambda_expression: $ => seq(
      field('parameters', $._lambda_parameters),
      '=>',
      field('body', $.lambda_body),
    ),

    _lambda_parameters: $ => choice(
      $.identifier,
      seq('(', optional($.lambda_parameter_list), ')'),
    ),

    lambda_body: $ => choice($.block, $._expression),

    assignment_expression: $ => choice(
      $.logical_or_expression,
      prec.right(PREC.assignment, seq(
        field('left', $.logical_or_expression),
        field('operator', choice('=', '+=', '-=')),
        field('right', $.assignment_expression),
      )),
    ),

    logical_or_expression: $ => prec.left(PREC.logical_or, sep1($.logical_and_expression, '||')),
    logical_and_expression: $ => prec.left(PREC.logical_and, sep1($.equality_expression, '&&')),
    equality_expression: $ => prec.left(PREC.equality, sep1($.comparison_expression, choice('===', '!==', '==', '!='))),
    comparison_expression: $ => prec.left(PREC.comparison, sep1($.additive_expression, choice('<=', '>=', '<', '>'))),
    additive_expression: $ => prec.left(PREC.additive, sep1($.multiplication_expression, choice('+', '-'))),
    multiplication_expression: $ => prec.left(PREC.multiplicative, sep1($.unary_expression, choice('*', '/'))),

    unary_expression: $ => choice(
      $.spawn_expression,
      prec(PREC.unary, seq(
        repeat(choice('-', '!')),
        field('operand', $.postfix_expression),
      )),
    ),

    spawn_expression: $ => seq('spawn', field('task', $.postfix_expression)),

    postfix_expression: $ => prec(PREC.postfix, seq(
      field('operand', $.primary_expression),
      repeat(choice($.call_suffix, $.member_access, $.try_operator)),
    )),

    call_suffix: $ => seq('(', optional($.argument_list), ')'),
    member_access: $ => seq('.', field('member', $.identifier)),
    try_operator: _ => '?',

    primary_expression: $ => choice(
      $.literal,
      $.macro_invocation,
      $.macro_metavariable,
      $._enum_constructor_expression,
      $.struct_literal_expression,
      $.range_expression,
      $.identifier,
      $.parenthesized_expression,
      $.block,
    ),

    _enum_constructor_expression: $ => seq(
      field('path', $.enum_path),
      optional(seq('(', optional($.argument_list), ')')),
    ),

    struct_literal_expression: $ => prec(PREC.primary, seq(
      field('type', $._type_path),
      '{',
      optional($.field_value_list),
      '}',
    )),

    wildcard_pattern: _ => '_',
`,

    helpers: `
function sep1(rule, separator, trailing = false) {
  return trailing
    ? seq(rule, repeat(seq(separator, rule)), optional(separator))
    : seq(rule, repeat(seq(separator, rule)));
}
`,
  };
}
