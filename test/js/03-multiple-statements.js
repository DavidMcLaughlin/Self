function testMultipleStatements() {
    assertEquals(eval("5 + 10; 20 - 10;"), compileAndRun("5 + 10; 20 - 10;"));
    assertEquals(eval('"foo" + "bar"; "foobar" + 10;'), compileAndRun('"foo" + "bar"; "foobar" + 10;'));
}