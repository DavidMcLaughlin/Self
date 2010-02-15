function testSimpleAssignment() {
    assertEquals(1, compileAndRun('var test = 1; test;')); 
}