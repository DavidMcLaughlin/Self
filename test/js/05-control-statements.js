function testIfStatement() {
    var testcode = "var x; if(true) { x = 10; } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));    

    testcode = "var x = true; if(x === true && false) { x = 10; } else if (x === false) { x = 20; } else { x = 50; } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));
}

function testForStatement() {
    var testcode = "var x = 0; for(var i = 0, j = 5; i < j; i++) { x += i; } x;";
    assertEquals(eval(testcode), compileAndRun(testcode));
}

function testDoStatement() {
    assert(false);
}

function testWhileStatement() {
    assert(false);
}

function testSwitchStatement() {
    assert(false);
}

function testTryStatement() {
    assert(false);
}

function testLabelledStatement() {
    assert(false);
}