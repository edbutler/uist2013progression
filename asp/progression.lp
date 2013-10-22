
level(0..N-1) :- config(num_levels, N).

% expects concept/1 to be defined elsewhere
% program tries to assign which levels have which concepts (unless the level was locked by the user)
{ contains(L, C) : concept(C) } :- level(L), not locked(L).

% computing the first time a concept shows up
exists_earlier(L, C) :- level(L), level(L2), contains(L2, C), L2 < L.
first_instance(L, C) :- contains(L, C), not exists_earlier(L, C).
exists_by(L, C) :- contains(L, C).
exists_by(L, C) :- exists_earlier(L, C).

total_introduced(L, N) :- level(L), N = #count { first_instance(X,C) : level(X) : X < L : concept(C) }.

% concept-specific intro constraints

% force concept to be introduced within a particular range
violatable(intro_minintro(C), 50) :- concept(C).
violation(intro_minintro(C), 1) :- intro_minintro(C, L), exists_earlier(L, C).
violatable(intro_maxintro(C), 50) :- concept(C).
violation(intro_maxintro(C), 1) :- intro_maxintro(C, L), not exists_by(L, C).

% force concepts to not be introduced after the dwell time
violatable(intro_dwell(C), 20) :- concept(C).
violation(intro_dwell(C), 1) :-
    intro_dwell(C, T),
    C != C2,
    first_instance(L1, C),
    first_instance(L2, C2),
    L2 >= L1,
    L2 < L1 + T.

% ensure two concepts are not introduced simultaneously
%violatable(simul(C2,C1), 8) :- concept(C2;C1), C2 != C1.
%violation(simul(C2,C1), 1) :- first_instance(L, C1), first_instance(L, C2), C1 != C2.


% ensure prereqs are satisfied
violatable(prereq(C2,C1), 10) :- prereq(C2,C1).
violation(prereq(C2,C1), 1) :- first_instance(L1, C1), first_instance(L2, C2), prereq(C2, C1), L2 <= L1.

% ensure coreqs are satisfied
violatable(coreq(C1,C2), 20) :- coreq(C1,C2).
violation(coreq(C1,C2), 1) :- contains(L, C1), coreq(C1, C2), not contains(L, C2).

% ensure every concept is used at least once
concept_is_used(C) :- contains(_, C).
:- concept(C), not concept_is_used(C).

adjacent_levels(L1, L2) :- level(L1), level(L2), L1 == L2 - 1.

% ensure two levels in a row do not use the same concept set
levels_have_difference(L1, L2) :- contains(L1, C), level(L2), not contains(L2, C).
levels_have_difference(L1, L2) :- contains(L2, C), level(L1), not contains(L1, C).
violatable(diff(L1, L2), 2) :- adjacent_levels(L1, L2).
violation(diff(L1,L2), 2) :- adjacent_levels(L1, L2), not levels_have_difference(L1, L2).

% ensure a concept isn't used more than 4 levels in a row
%chain(L, C, 1) :- contains(L, C).
%chain(L, C, N) :- level(N), N > 1, contains(L, C), adjacent_levels(L2, L), chain(L2, C, N - 1).
%violatable(chain(C), 3) :- concept(C).
%violation(chain(C), 3) :- chain(_, C, 5).

% ensure every level has at least one concept
non_empty(L) :- contains(L, _).
violatable(empty(L), 1000) :- level(L).
violation(empty(L), 1) :- level(L), not non_empty(L).

% try to reach the target number of concepts per level
concept_type(CT) :- concept_type(_, CT).

violatable(intensity(CT,L), 2) :- concept_type(CT), level(L).
violation(intensity(CT,L), S) :-
    concept_type(CT), level(L), intensity(CT,L,N),
    M = #count { contains(L, C) : concept_type(C, CT) },
    N != M, S := #abs (N - M).

violatable(newrate(L), 10) :- level(L).
violation(newrate(L), 1) :- level(L), total_introduced(L,N), N != M, cummulative_concepts(L, M).

#minimize [ violation(V,N)=S*N : violatable(V,S) ].

#hide.
#show locked/1.
#show contains/2.
#show level/1.
#show violation/2.

