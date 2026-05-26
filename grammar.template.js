/**
 * Beskid tree-sitter grammar — aligned with /Users/mikserek/Projects/beskid/compiler/crates/beskid_analysis/src/beskid.pest
 * Regenerate: ./scripts/sync-from-pest.sh
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

/** @type {import('tree-sitter-cli/dsl').Precedence[]} */
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
};

export default grammar({
  name: 'beskid',

  extras: $ => [
    /\s/,
    $.line_comment,
    $.block_comment,
  ],

  word: $ => $.identifier,

  supertypes: $ => [
    $._item,
    $._statement,
    $._expression,
    $._type,
    $._pattern,
    $._field,
  ],

  inline: $ => [
    $._item,
    $._statement,
    $._expression,
    $._type,
    $._pattern,
    $._field,
    $._type_name,
  ],

  conflicts: $ => [
    [$._type, $._expression],
    [$._expression, $._pattern],
    [$._type_path_segment],
    [$.arrow_function_type, $._lambda_parameters],
    [$.type_reference, $.parameter_modifier],
    [$.contract_method_signature, $.contract_embedding],
    [$.registry_block, $.registry_entry],
    [$._type_path_segment, $.contract_embedding],
    [$._type_path_segment, $.primary_expression],
    [$._type_path_segment, $._lambda_parameters],
    [$._type_path_segment, $._parameter],
    [$._enum_constructor_expression],
    [$._type_path_segment, $.lambda_parameter],
    [$._type_path_segment, $.lambda_parameter, $.primary_expression],
    [$.macro_invocation],
    [$.lambda_parameter, $.primary_expression],
    [$.lambda_body, $.primary_expression],
    [$._lambda_parameters, $.primary_expression],
  ],

  rules: {

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

    doc_comment: _ => token(repeat1(seq('///', /[^/\n].*/, /\n?/))),

    line_comment: _ => token(choice(
      seq('////', /.*/),
      seq('//', /[^/\n]/, /.*/),
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

    primitive_type: _ => choice('bool', 'i32', 'i64', 'u8', 'f64', 'char', 'string', 'unit'),

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


    visibility: _ => 'pub',

    attribute_list: $ => repeat1($.attribute),

    attribute: $ => seq(
      '[',
      field('name', $.identifier),
      optional(seq('(', optional($.attribute_argument_list), ')')),
      ']',
    ),

    attribute_argument_list: $ => sep1($.attribute_argument, ','),

    attribute_argument: $ => seq(
      field('name', $.identifier),
      ':',
      field('value', $._expression),
    ),

    attribute_declaration: $ => seq(
      optional($.visibility),
      'attribute',
      field('name', $.identifier),
      optional($.attribute_target_list),
      field('body', $.attribute_body),
    ),

    attribute_body: $ => seq('{', optional($.attribute_parameter_list), '}'),

    attribute_target_list: $ => seq('(', sep1($.identifier, ',', true), ')'),

    attribute_parameter_list: $ => sep1($.attribute_parameter, ',', true),

    attribute_parameter: $ => seq(
      field('name', $.identifier),
      ':',
      field('type', $._type),
      optional(seq('=', field('default', $._expression))),
    ),

    module_declaration: $ => seq(
      optional($.attribute_list),
      optional($.visibility),
      'mod',
      field('name', $._type_path),
      ';',
    ),

    inline_module: $ => seq(
      optional($.attribute_list),
      optional($.visibility),
      'mod',
      field('name', $.identifier),
      field('body', $.inline_module_body),
    ),

    inline_module_body: $ => seq('{', repeat($.item_with_docs), '}'),

    use_declaration: $ => seq(
      optional($.visibility),
      'use',
      field('path', $._type_path),
      optional(seq('as', field('alias', $.identifier))),
      ';',
    ),

    enum_path: $ => seq($.identifier, '::', $.identifier),

    path_list: $ => sep1($._type_path, ','),

    array_type: $ => seq($._type_name, '[', ']'),

    type_reference: $ => seq('ref', $._type_name),

    function_type: $ => seq($._type_name, '(', optional($.type_list), ')'),

    arrow_function_type: $ => seq(
      '(',
      optional($.type_list),
      ')',
      '=>',
      $._type,
    ),

    type_list: $ => sep1($._type, ','),

    generic_parameters: $ => seq('<', sep1($.identifier, ','), '>'),

    generic_arguments: $ => seq('<', sep1($._type, ','), '>'),

    type_definition: $ => seq(
      optional($.visibility),
      'type',
      field('name', $.identifier),
      optional($.generic_parameters),
      optional($.type_conformance_list),
      field('body', $.field_body),
    ),

    type_conformance_list: $ => seq(':', $.path_list),

    field_body: $ => seq('{', optional($.field_list), '}'),

    field_list: $ => sep1($.field_with_docs, ',', true),

    field_with_docs: $ => seq(
      optional($.doc_comment),
      $._field,
    ),

    _field: $ => choice(
      $.value_field,
      $.event_field,
      $.inject_field,
    ),

    value_field: $ => seq(
      optional($.visibility),
      field('type', $._type),
      field('name', $.identifier),
    ),

    event_field: $ => seq(
      optional($.visibility),
      'event',
      optional($.event_capacity),
      field('name', $.identifier),
      '(',
      optional($.parameter_list),
      ')',
    ),

    event_capacity: $ => seq('{', field('capacity', $.integer_literal), '}'),

    inject_field: $ => seq(
      optional($.visibility),
      'inject',
      optional($.inject_qualifier),
      field('type', $._type),
      field('name', $.identifier),
    ),

    inject_qualifier: $ => seq(choice('global', 'parent'), '::'),

    enum_definition: $ => seq(
      optional($.visibility),
      'enum',
      field('name', $.identifier),
      optional($.generic_parameters),
      field('body', $.enum_body),
    ),

    enum_body: $ => seq('{', optional($.enum_variant_list), '}'),

    enum_variant_list: $ => sep1($.enum_variant_with_docs, ',', true),

    enum_variant_with_docs: $ => seq(
      optional($.doc_comment),
      $.enum_variant,
    ),

    enum_variant: $ => seq(
      field('name', $.identifier),
      optional(seq('(', optional($.field_list), ')')),
    ),

    function_definition: $ => seq(
      optional($.attribute_list),
      optional($.visibility),
      field('return_type', $._type),
      field('name', $.identifier),
      optional($.generic_parameters),
      '(',
      optional($.parameter_list),
      ')',
      field('body', $.block),
    ),

    parameter_list: $ => sep1($.parameter_with_docs, ','),

    parameter_with_docs: $ => seq(
      optional($.doc_comment),
      $._parameter,
    ),

    _parameter: $ => seq(
      optional(prec(2, $.parameter_modifier)),
      field('type', $._type),
      optional('mut'),
      field('name', $.identifier),
    ),

    parameter_modifier: _ => choice('ref', 'out'),

    impl_block: $ => seq(
      'impl',
      field('receiver', $.receiver_type),
      field('body', $.impl_body),
    ),

    extend_type_definition: $ => seq(
      'extend',
      'type',
      field('receiver', $.receiver_type),
      field('body', $.impl_body),
    ),

    receiver_type: $ => choice($.primitive_type, alias($._type_path, $.type_path)),

    impl_body: $ => seq('{', repeat($.impl_method_with_docs), '}'),

    impl_method_with_docs: $ => seq(
      optional($.doc_comment),
      $.impl_method,
    ),

    impl_method: $ => seq(
      optional($.visibility),
      field('return_type', $._type),
      field('name', $.identifier),
      '(',
      optional($.parameter_list),
      ')',
      field('body', $.block),
    ),

    macro_definition: $ => seq(
      optional($.visibility),
      'macro',
      field('name', $.identifier),
      '(',
      optional($.macro_parameter_list),
      ')',
      field('body', $.block),
    ),

    macro_parameter_list: $ => sep1($.macro_parameter, ','),

    macro_parameter: $ => seq(
      field('kind', $.macro_fragment_kind),
      field('name', $.identifier),
    ),

    macro_fragment_kind: _ => choice(
      'block', 'expression', 'statement', 'type', 'identifier',
      'literal', 'pattern', 'path', 'item', 'node',
    ),

    contract_definition: $ => seq(
      optional($.attribute_list),
      optional($.visibility),
      'contract',
      field('name', $.identifier),
      field('body', $.contract_body),
    ),

    contract_body: $ => seq('{', repeat($.contract_item_with_docs), '}'),

    contract_item_with_docs: $ => seq(
      optional($.doc_comment),
      $._contract_item,
    ),

    _contract_item: $ => choice(
      $.contract_method_signature,
      $.contract_embedding,
    ),

    contract_method_signature: $ => seq(
      field('return_type', $._type),
      field('name', $.identifier),
      '(',
      optional($.parameter_list),
      ')',
      ';',
    ),

    contract_embedding: $ => seq(
      field('name', $.identifier),
      optional(';'),
    ),

    host_definition: $ => seq(
      'host',
      field('name', $.identifier),
      '(',
      optional($.parameter_list),
      ')',
      optional(seq(':', field('base', $._type_path))),
      field('body', $.host_body),
    ),

    host_body: $ => seq('{', repeat($._host_body_item), '}'),

    _host_body_item: $ => choice(
      $.registry_block,
      $.scope_hook,
      $.scope_definition,
    ),

    registry_block: $ => seq('registry', field('body', $.registry_body)),

    registry_body: $ => seq('{', repeat($.registry_entry), '}'),

    registry_entry: $ => seq(
      optional($.registration_lifetime),
      field('type', $._type_path),
      optional(seq('for', field('target', $._type_path))),
      ';',
    ),

    registration_lifetime: _ => choice('single', 'transient'),

    scope_definition: $ => seq(
      'scope',
      field('name', $.identifier),
      '(',
      optional($.parameter_list),
      ')',
      field('body', $.scope_body),
    ),

    scope_body: $ => seq('{', repeat($._scope_body_item), '}'),

    _scope_body_item: $ => choice(
      $.registry_block,
      $.scope_hook,
      $.scope_definition,
      $.registry_entry,
    ),

    scope_hook: $ => seq(
      choice('init', 'dispose', 'startup'),
      '(',
      optional($.parameter_list),
      ')',
      field('body', $.block),
    ),

    test_definition: $ => seq(
      optional($.attribute_list),
      optional($.visibility),
      'test',
      field('name', $.identifier),
      field('body', $.test_body),
    ),

    test_body: $ => seq('{', repeat($.test_body_item_with_docs), '}'),

    test_body_item_with_docs: $ => seq(
      optional($.doc_comment),
      $._test_body_item,
    ),

    _test_body_item: $ => choice(
      $.test_meta_section,
      $.test_skip_section,
      $._statement,
    ),

    test_meta_section: $ => seq(
      'meta',
      field('body', $.test_meta_body),
    ),

    test_meta_body: $ => seq('{', repeat($.test_metadata_entry), '}'),

    test_metadata_entry: $ => seq(
      field('name', $.identifier),
      '=',
      field('value', $._expression),
      ';',
    ),

    test_skip_section: $ => seq(
      'skip',
      field('body', $.test_skip_body),
    ),

    test_skip_body: $ => seq('{', repeat($.test_skip_entry), '}'),

    test_skip_entry: $ => seq(
      field('name', $.identifier),
      '=',
      field('value', $._expression),
      ';',
    ),

    block: $ => seq('{', repeat($._statement), '}'),

    _statement: $ => choice(
      $.let_statement,
      $.return_statement,
      $.break_statement,
      $.continue_statement,
      $.while_statement,
      $.for_statement,
      $.if_statement,
      $.with_statement,
      $.launch_statement,
      $.expression_statement,
    ),

    let_statement: $ => choice($.typed_let_statement, $.inferred_let_statement),

    typed_let_statement: $ => seq(
      field('type', $._type),
      optional('mut'),
      field('name', $.identifier),
      '=',
      field('value', $._expression),
      ';',
    ),

    inferred_let_statement: $ => seq(
      'let',
      field('name', $.identifier),
      '=',
      field('value', $._expression),
      ';',
    ),

    return_statement: $ => seq('return', optional($._expression), ';'),

    break_statement: _ => seq('break', ';'),

    continue_statement: _ => seq('continue', ';'),

    if_statement: $ => seq(
      'if',
      field('condition', $._expression),
      field('consequence', $.block),
      optional(seq('else', field('alternative', $.block))),
    ),

    while_statement: $ => seq(
      'while',
      field('condition', $._expression),
      field('body', $.block),
    ),

    for_statement: $ => seq(
      'for',
      field('name', $.identifier),
      'in',
      field('iterator', $._expression),
      field('body', $.block),
    ),

    with_statement: $ => seq(
      'with',
      field('name', $.identifier),
      '(',
      optional($.argument_list),
      ')',
      field('body', $.block),
    ),

    launch_statement: $ => seq(
      'launch',
      field('path', $._type_path),
      '(',
      optional($.argument_list),
      ')',
      ';',
    ),

    expression_statement: $ => seq($._expression, ';'),

    lambda_parameter_list: $ => sep1($.lambda_parameter, ','),

    lambda_parameter: $ => choice(
      seq(field('type', $._type), field('name', $.identifier)),
      $.identifier,
    ),

    macro_invocation: $ => seq(
      field('name', $.identifier),
      '!',
      optional(seq('(', optional($.argument_list), ')')),
      optional(field('body', $.block)),
    ),

    macro_metavariable: $ => seq('$', field('name', $.identifier)),

    range_expression: $ => seq(
      'range',
      '(',
      field('start', $._expression),
      ',',
      field('end', $._expression),
      ')',
    ),

    field_value_list: $ => sep1($.field_value, ',', true),

    field_value: $ => seq(
      field('name', $.identifier),
      ':',
      field('value', $._expression),
    ),

    parenthesized_expression: $ => seq('(', $._expression, ')'),

    argument_list: $ => sep1($._expression, ','),

    match_expression: $ => seq(
      'match',
      field('value', $._expression),
      '{',
      optional(seq(sep1($.match_arm, ','), optional(','))),
      '}',
    ),

    match_arm: $ => seq(
      field('pattern', $._pattern),
      optional(seq('when', field('guard', $._expression))),
      '=>',
      field('body', $._expression),
    ),

    _pattern: $ => choice(
      $.wildcard_pattern,
      $.enum_pattern,
      $.identifier,
      $.literal,
    ),

    enum_pattern: $ => seq(
      field('path', $.enum_path),
      optional(seq('(', optional($.pattern_list), ')')),
    ),

    pattern_list: $ => sep1($._pattern, ','),

    literal: $ => choice(
      $.integer_literal,
      $.float_literal,
      $.string_literal,
      $.char_literal,
      'true',
      'false',
    ),

    integer_literal: _ => token(seq(optional('-'), /\d+/)),

    float_literal: _ => token(seq(optional('-'), /\d+/, '.', /\d+/)),

    string_literal: $ => seq(
      '"',
      repeat(choice(
        $.string_interpolation,
        $.string_escape,
        $.string_content,
      )),
      '"',
    ),

    string_interpolation: $ => seq('${', field('expression', $._expression), '}'),

    string_escape: _ => choice('\\"', '\\\\', '\\${'),

    string_content: _ => token(prec(-1, repeat1(choice(
      /[^"\\$]+/,
      /\$[^{]/,
    )))),

    char_literal: _ => token(seq(
      "'",
      choice("\\'", /[^']/),
      "'",
    )),

  },
});


function sep1(rule, separator, trailing = false) {
  return trailing
    ? seq(rule, repeat(seq(separator, rule)), optional(separator))
    : seq(rule, repeat(seq(separator, rule)));
}

