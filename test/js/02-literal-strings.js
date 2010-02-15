function testBasicString() {
    assertEquals("hello", compileAndRun("'hello';"));    
    assertEquals("hello, world.", compileAndRun('"hello, world.";'));
}

function testQuotationType() {
    assertEquals("isn't", compileAndRun('"isn\'t";'));
    assertEquals('"wow," said the thief.', compileAndRun("'\"wow,\" said the thief.';"));
}

function testEscapedQuotes() {
    assertEquals("I said: \"kiss me you're beautiful - these are truly the last days.\"", 
                 compileAndRun('"I said: \\"kiss me you\'re beautiful - these are truly the last days.\\"";'));
    
    assertEquals("Isn\'t it funny how \'strings\' work?", 
                 compileAndRun("'Isn\\'t it funny how \\'strings\\' work?';"));
}

function testEscapedCharacters() {
    assertEquals("\\\\", compileAndRun('"\\\\\\\\";'));
}

function testMultiLines() {
    assertEquals("UNIX\nRulez\nWindows\nDroolz.", compileAndRun("'UNIX\\nRulez\\nWindows\\nDroolz.';"));
}

function testStringAddition() {
    assertEquals("foo" + "bar", compileAndRun('"foo" + "bar";'));
    assertEquals('He said "hello, world"' + " back in '99", compileAndRun("'He said \"hello, world\"' + \" back in '99\";"));
    assertEquals("Line " +
    "breaks", compileAndRun('"Line "+\n"breaks";'));
    assertEquals("Different "
    + "line breaks", compileAndRun('"Different "\n+"line breaks";'));
}
