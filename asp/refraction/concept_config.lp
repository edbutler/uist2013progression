
% configuration for generate.lp for concepts

available_source_power((1,1)) :- not config(adding).
available_source_power((1,3)) :- config(adding).

type(s0,source).
type(s1,source) :- config(adding).
type(s2,source) :- config(adding), config(wasting).

num_combiner(1) :- config(adding).

num_bender(3) :- config(bending).
%num_bender(3) :- config(adding), config(splitting).

num_splitter(2) :- config(splitting).

num_blocker(11) :- config(blockers).

num_target(1) :- not config(splitting).
num_target(2) :- config(wasting).
num_target(4) :- config(splitting), not config(wasting).


bender(1..N) :- num_bender(N).
splitter(1..N) :- num_splitter(N).
blocker(1..N) :- num_blocker(N).
target(1..N) :- num_target(N).
combiner(1..N) :- num_combiner(N).

type((bnd,X), bender) :- bender(X).

type((sp,X),splitter2) :- splitter(X), X #mod 2 == 0.
type((sp,X),splitter3) :- splitter(X), X #mod 2 == 1.

type((trg,X),target) :- target(X).

type((blk,X),blocker) :- blocker(X).

type((com,X),combiner2) :- combiner(X).

piece(P) :- type(P,_).



