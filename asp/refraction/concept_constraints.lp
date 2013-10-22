
active(P) :- emits(_,P,_).

% bending

active_bender(P) :- active(P), type(P,bender), config(bending).
violation :- config(bending), not N { active_bender(P) }, num_bender(N).
violation :- config(bending), num_bender(N), N < 3.

% splitting

active_splitter(P) :- active(P), type(P,splitter2), config(splitting).
active_splitter(P) :- active(P), type(P,splitter3), config(splitting).
violation :- config(splitting), not N { active_splitter(P) }, num_splitter(N).
violation :- config(splitting), num_splitter(0).

% adding

active_combiner(P) :- active(P), type(P,combiner2), config(adding).
active_combiner(P) :- active(P), type(P,combiner3), config(adding).
violation :- config(adding), not N { active_combiner(P) }, num_combiner(N).
violation :- config(adding), num_combiner(0).

% blockers

violation :- config(blockers), not 1 { type(P,blocker) }.

% wasting
interactive_piece(P) :- type(P,T), T != blocker.
outgoing_beams(P,M) :- active(P), type(P,T), ports(T,_,M).
edge(P1,P2) :- grid_edge(P1,P2,D).
is_wasted :- config(wasting), interactive_piece(P), 1 [ outgoing_beams(P,M)=M, edge(P,Q)=-1:piece(Q) ].
violation :- config(wasting), not is_wasted.

% crossing
cmp(P1,P2,A,lt) :- config(crossing), lt_coord(P1,P2,A).
cmp(P2,P1,A,gt) :- config(crossing), lt_coord(P1,P2,A).
cmp(P1,P2,A,gt) :- config(crossing), gt_coord(P1,P2,A).
cmp(P2,P1,A,lt) :- config(crossing), gt_coord(P1,P2,A).

crossing :-
  grid_edge(A,B,(H,RH)),
  grid_edge(C,D,(V,RV)),
  cmp(A,C,H,RH),
  cmp(D,B,H,RH),
  cmp(C,B,V,RV),
  cmp(A,D,V,RV),
  A != C,
  B != D,
  H < V.
violation :- config(crossing), not crossing.

% this actually causes constraints to be enforced

__concept :- not violation.

