$(function() {
    Object.prototype.clone = function() {
        var newObj = (this instanceof Array) ? [] : {};
        for (i in this) {
            if (i == 'clone'){ 
                continue;
            }
            if (this[i] && typeof this[i] == "object") {
                newObj[i] = this[i].clone();
            } else { 
                newObj[i] = this[i];
            }
        } 
        return newObj;
    };

    var sudoku = (function() {
        var rows = 'ABCDEFGHI';
        var cols = '123456789';
        
        function cross(str1, str2) {
            var results = new Array();
            for(var i = 0; i < str1.length; i++) {
                for(var j = 0; j < str2.length; j++) {
                    results.push((str1.charAt(i) + str2.charAt(j)).toString());
                }
            }
            return results;
        }
        
        // List of all the tiles in sudoku application
        var tiles = cross(rows, cols);
        
        // List of all the possible units
        var unitLists = (function() {
            var results = new Array();
            // Generates lists A1 ... A9, B1 ... B9, etc
            for(var c = 0; c < cols.length; c++) {
                results.push(cross(rows, cols.charAt(c)));
            }
            //Generates lists A1 ... I1, A2 ... I2, etc
            for(var r = 0; r < rows.length; r++) {
                results.push(cross(rows.charAt(r), cols));
            }
            //Generates lists of tile ids in each units
            var rowTiles = ['ABC', 'DEF', 'GHI'];
            var colTiles = ['123', '456', '789'];
            for(var i = 0; i < rowTiles.length; i++) {
                for(var j = 0; j < rowTiles.length; j++) {
                    results.push(cross(rowTiles[i], colTiles[j]));
                }
            }                    
            return results;
        })();
        
        // Map between a tile and the units that contain it
        var units = (function() {
            var map = {};
            function findUnitsWithTile(tile) {
                var unitWithTile = new Array();
                $.each(unitLists, function(index, list) {
                    if($.inArray(tile, list) > -1) {
                        unitWithTile.push(list);
                    }
                });
                return unitWithTile;
            }
            $.each(tiles, function(index, tile) {
                map[tile] = findUnitsWithTile(tile);
            });
            return map;
        })();
        
        // Map between a tile and its peers (peers are all the tiles in the units containing the key tile)
        var peers = (function() {
            var map = {};
            function unionOfUnits(tile) {
                var results = new Array();
                $.each(units[tile], function(index, unit) {
                    $.each(unit, function() {
                        var curTile = this.toString();
                        // If it is not in the array place it in the results
                        if($.inArray(curTile, results) === -1 && tile !== curTile) {
                            results.push(curTile);
                        }
                    });
                });
                return results;
            }
            
            $.each(tiles, function(index, tile) {
                map[tile] = unionOfUnits(tile);
            });
            return map;
        })();
        
        return {
            init: function() {
                $('#newGame').click(sudoku.reset);
                $('#createPuzzle').click(sudoku.createPuzzle);
                $('#solve').click(sudoku.solver.solve);
                $('#sample').click(function() {
                    sudoku.reset();
                    var sampleBoard = {'A2':3, 'A9':1, 'B5':9, 'B7':8, 'B8':5, 'C3':8, 'C4':7, 'C6':6,
                        'D2':9, 'D4':3, 'D7':1, 'D8':4, 'E5':4, 'F2':4, 'F3':5, 'F6':1, 'F8':3, 
                        'G4':6, 'G6':5, 'G7':2, 'H2':2, 'H3':4, 'H5':8, 'I1':8, 'I8':6};

                    for (var key in sampleBoard) {
                        $('#'+key).val(sampleBoard[key]);
                    }
                    sudoku.createPuzzle();
                });
            },
            reset: function() {
                // Reset all the text input boxes
                $('tr input[type=text]').removeAttr('disabled').val("");
            },
            createPuzzle: function() {
                $("input[type=text]").each(function() {
                    if ($(this).val()) {
                        $(this).attr('disabled', true);
                    }
                });
            },
            solver: (function() {
                // function to initialize the board
                function initialize() {
                    var map = {};
                    $.each(tiles, function(index, tile) {
                        map[tile] = '123456789';
                    });
                    return map;
                }

                // Update the board
                function print(_board) {
                    $.each(_board, function(tile, value) {
                        $("#"+tile).val(value);
                    });    
                }
    
                // Solves the puzzle using constraint-propagation and depth-first search
                function solve() {
                    board = initialize();
                    sudoku.createPuzzle();
                    
                    // Returns true if the board is solved
                    function solved(values) {
                        var solved = true;
                        $.each(values, function(key, value) {
                            if (typeof value === 'string' && value.length !== 1) {
                                solved = false;
                            }
                        });
                        return solved;
                    };
                    // Returns the tile with least possible values
                    function tileLeastPossible(values) {
                        var least = null, bestTile = null;
                        $.each(values, function(tile, value) {
                            // If it is a first iteration or smaller value is found set the best tile 
                            if ((typeof value === 'string') && (least === null || value.length < least)
                                && value.length > 1) {
                                least = value.length;
                                bestTile = tile;
                            }
                        });
                        return bestTile;
                    };     

                    // Recursively assign value to the unsolved square until the board is solved
                    function search(values) {
                        // Search failed earlier so terminate
                        if (values === false) {
                            return false;
                        }
                        if (solved(values)) {
                            return values;
                        } else { 
                            // Find the tile with the smallest number of possible values
                            var tile = tileLeastPossible(values);
                            var possibilities = values[tile];
                            // For each value on the board. Call assignRec with copy of the current board
                            for (var i = 0; i < possibilities.length; i++) {
                                var result = search(assignRec(values.clone(), possibilities.charAt(i), tile));
                                if (result !== false) {
                                    return result;
                                }        
                            }
                            return false;
                        }
                    };

                    $("input:disabled").each(function() {
                        var val = $(this).val();
                        if (val != '') {
                            assign(val, $(this).attr('id'));    
                        }
                    });

                    var result = search(board);
                    board = result ? result : board;
                    print(board);
                }
                
                // value: value to eliminate (in char)
                // tile: tile to eliminate the value from
                // 
                // returns false if the operation failed
                function assign(value, tile) {
                    // Copy is made to work on the constraints propagation, since if the
                    // value is not valid board must be unchanged (look at main.js for clone function)
                    var copiedBoard = board.clone();
                    var result = assignRec(copiedBoard, value, tile);
                    if (result === false) {
                        return false;
                    }
                    board = result;
                    return true;
                }
                
                // copiedBoard: copy of the original board
                // value: value to assign (in char)
                // tile: tile to assign the value to 
                // 
                // returns new board if the operation succeeded, and false if the operation failed
                function assignRec(copiedBoard, value, tile) {
                    var otherValues = copiedBoard[tile].replace(value, '');
                    for (var i = 0; i < otherValues.length; i++) {
                        if (eliminateRec(copiedBoard, otherValues[i], tile) === false) {
                            return false;
                        }
                    }
                    return copiedBoard;
                }
                
                // copiedBoard: reflence to the copy of the board
                // value: value to eliminate (in char)
                // tile: tile to eliminate the value from
                //  
                // Recursive helper function to perform the elimination process (constraint propagation)
                // returns false if the operation failed and returns the new board if the operation succeeded
                // make sure to assign the returned board to the original board to reflect the result of elimination
                function eliminateRec(copiedBoard, value, tile) {
                    if (copiedBoard[tile].indexOf(value) === -1) {
                        // Value already removed so return unchanged board
                        return copiedBoard;
                    }
                    copiedBoard[tile] = copiedBoard[tile].replace(value, '');
                    
                    if (copiedBoard[tile].length === 0) {
                        return false;
                    } else if (copiedBoard[tile].length === 1) {
                        // If there is only one possible value remaining in the tile,
                        // eliminate the value from its peers
                        
                        // Create copy (to avoid the value from getting accidentally modified)
                        var value2 = copiedBoard[tile].slice(0); 
                        var peersOfTile = peers[tile];
                        for (var i = 0; i < peersOfTile.length; i++) {
                            if (eliminateRec(copiedBoard, value2, peersOfTile[i]) === false) {
                                return false;
                            }
                        }
                    }
                    
                    // For each unit containing 'tile' find all tile in the unit with the 'value' as the possible value
                    var unitsWithTile = units[tile];
                    for (var ind in unitsWithTile) {
                        var unit = unitsWithTile[ind];
                        if ( !(unit instanceof Function) ) {
                            for (var i = 0; i < unit.length; i++) {
                                if (copiedBoard[unit[i]].length === 0) {
                                    // Something wrong happened
                                    return false;
                                }
                                // If the only possible value possible on this tile is this value than assign it
                                if (copiedBoard[unit[i]].indexOf(value) > -1 && copiedBoard[unit[i]].length === 1) {    
                                    // We can assign this value to this tile
                                    if (assignRec(copiedBoard, value, unit[i]) === false) {
                                        return false;
                                    }
                                }
                            }
                        }
                    }
                    return copiedBoard;
                };
                
                var board = initialize();
                
                return {
                    board: board,
                    assign: assign,
                    solve: solve,
                    print: print
                }
            })(),
            test: function() {
                console.log('*********** unit lists ************');
                for (var i = 0; i < unitLists.length; i++) {
                    console.log('[' + unitLists[i].toString() + ']');
                }
                console.log('*********** units ************');
                for (var tile in units) {
                    if ( !(units[tile] instanceof Function) ) {
                        var listString = '[';
                        var unitsContainingTile = units[tile];
                        for(var i = 0; i < unitsContainingTile.length; i++) {
                            listString += ' [' + unitsContainingTile[i].toString() + '] ';
                        }
                        console.log(tile + ": " + listString + ' ]');
                    }
                }
                console.log('*********** peers ************');
                for (var tile in peers) {
                    if ( !(peers[tile] instanceof Function) ) {    
                        console.log(tile + ": " + peers[tile].toString());
                    }
                }
            }
        }
    })();
    
    sudoku.init();
    //sudoku.test();
});
