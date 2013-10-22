
% count benders/splitter for constraints
num_bender(N) :- N = #sum [ type(P, bender) : piece(P) ].
num_splitter2(N) :- N = #sum [ type(P, splitter2) : piece(P) ].
num_splitter3(N) :- N = #sum [ type(P, splitter3) : piece(P) ].
num_splitter(A+B) :- num_splitter2(A), num_splitter3(B).
num_combiner2(N) :- N = #sum [ type(P, combiner2) : piece(P) ].
num_combiner3(N) :- N = #sum [ type(P, combiner3) : piece(P) ].
num_combiner(A+B) :- num_combiner2(A), num_combiner3(B).

