(function_definition
  name: (identifier) @name) @definition.function

(impl_method
  name: (identifier) @name) @definition.method

(macro_definition
  name: (identifier) @name) @definition.macro

(type_definition
  name: (identifier) @name) @definition.type

(enum_definition
  name: (identifier) @name) @definition.type

(contract_definition
  name: (identifier) @name) @definition.interface

(host_definition
  name: (identifier) @name) @definition.module

(test_definition
  name: (identifier) @name) @definition.test

(module_declaration
  name: (_) @name) @definition.namespace

(inline_module
  name: (identifier) @name) @definition.namespace

(use_declaration
  path: (_) @name) @name.reference.import

(call_suffix) @reference.call

(member_access
  member: (identifier) @name) @reference.field
