
<!-- 1-page proposal
- novel contribution?
- utility for leantutor
- don't spend too much time
- also explain the context of the existing system just so that if sanjit sees it he will get it -->

<!-- # Bounded Proof Synthesis Using SMT -->

**Bounded proof synthesis using SMT** is proposed as an algorithm for improving the feedback given by [LeanTutor](https://leantutor.org/), the intelligent tutoring system (ITS) developed by Prof. Ranade's research group.

### Background/Application

For each step in a student's proof, LeanTutor tells students whether the first-order formula (e.g., a mathematical equation) that they asserted follows from the premises that they assumed.

Currently, LeanTutor uses the Lean compiler and Lean tactics, manipulated using LLM-based proving agents; this corresponds to row 1 in the table below.

When an underapproximation of the students' input can be lowered to a quantifier-free formula, SMT solvers can show that an assertion does *not* follow from the premises, and with better empirical response times (e.g., < 100ms) than is easily attainable using LLM-based proof search. [This presentation](https://petervdonovan.github.io/10-2-26-presentation/1) and [web page](https://petervdonovan.github.io/10-2-26-presentation/docs/) provide more information on this approach. This corresponds to row 2 in the table.

This proposal is concerned with row 3.

| Method | Avoids LLM-based proof search | Used to disprove | Used to prove |
| --- | --- | --- | ---
| Proving agent | | | ✅ |
| Lower underapproximation to SMT QF_NRA | ✅ | ✅ | |
| **Proposal: bounded proof synthesis using SMT** | ✅ | | ✅

<!-- Non-neural approaches can potentially attain lower costs, faster response times, and higher reliability than those based on LLMs. The ability to both prove and disprove are both needed in order to provide feedback on whether a student's assertions are correct. For these reasons, the proposed approach of "bounded proof synthesis" could be complementary to the existing techniques. -->

### Proposal

Given premises $\Gamma$, a conclusion $\varphi$, and bounds $k,n$, decide whether there exists a valid natural deduction proof of $\Gamma\vdash\varphi$ containing at most $k$ inference nodes and with intermediate formulas of size at most $n$. This existence problem can be encoded as a quantifier-free SMT formula over algebraic datatypes.

Intuitively, if we think of proof rules as defining the possible transitions between proof states, then the difference between this and a Lean tactic such as `aesop` is a little bit like the difference between BMC (based on reduction to SMT) and enumerative search over possible execution traces.

<!-- It is well-known that BMC based on reduction to SMT can efficiently provide results in cases where enumerative search over possible execution traces would be infeasible.

If a proof system as analogous to a transition system in which proof rules modify the proof state, it seems reasonable to hope that bounded proof search based on reduction to an appropriate SMT theory can achieve similarly dramatic speedups over more enumerative approaches such as the Lean tactic `aesop`.

It is also possible to draw an analogy to SMT-based synthesis of bounded-size programs/implementations ([reactive synthesis example by Faymonville et al.](https://arxiv.org/html/1803.09570v1)). -->

<!-- Another analogy is to say that this is like the difference between SMT-based and enumerative program synthesis (citation needed). -->

This is not a novel idea (see the "Related Work" section for details). However, I believe that a new point in this design space could have novel properties wrt use cases and empirical performance:
- I am not aware of existing proof synthesis work that uses a recent QF\_DT solver, and certainly there exists some QF\_DT solver not yet tested for this use case.
- I am not aware of proof synthesis work that handles nontrivial (non-propositional) terms from first-order logic. Most of it seems focused on propositional logic/SAT or is focused on program synthesis, not synthesis of FOL natural deduction proofs.

If this approach results in a system that proves a majority of correct proof steps from our existing datasets with sub-second solve time, then I would consider this a success. It would be even better if we obtain a system that can outperform appropriate usage of `aesop`.

### Related Work

- There is existing work on synthesis of short/minimal resolution (not natural deduction) proofs of UNSAT in the case of boolean satisfiability: [Mencía & Silva](https://link.springer.com/chapter/10.1007/978-3-030-30244-3_45), [Peitl & Szeider](https://jair.org/index.php/jair/article/view/12589), [Sidorov et al](https://arxiv.org/abs/2411.07955).
    - Relatedly, CDCL solvers already tend to provide resolution proofs of UNSAT as a byproduct of their decision procedure. More generally, decision procedures do often provide proofs, but that doesn't help with deciding the existence of bounded proofs in undecidable theories.
<!-- - [This work by Fiorentini](https://link.springer.com/chapter/10.1007/978-3-030-79876-5_13) is close to what I propose, but focuses on propositional logic only, is based on an intuitionistic rather than classical formalism, and reduces the problem directly to SAT. Actually this seems to be merely a direct mapping of CDCL solving to an intuitionistic context. -->
- Because of the Curry-Howard correspondence on which dependently-typed systems like Lean are based, proof search is related to type-directed program synthesis. There is existing work on that for non-dependent type systems ([example by Guo et al.](https://arxiv.org/pdf/1911.04091)), and refinement type systems ([example by Frankel et al.](https://dl.acm.org/doi/10.1145/2914770.2837629)), which are both a bit more restrictive than full proof systems.
<!-- Program synthesizers also tend to be optimized for a slightly different use case than proof synthesizers. -->
  - [This paper by Reynolds et al.](https://theory.stanford.edu/~barrett/pubs/RKT+19.pdf) uses QF\_DT for program synthesis, but the typical constraints used in the proof search use case can be expected to differ from theirs.
  - It is also possible to draw an analogy to SMT-based synthesis of bounded-size programs/implementations ([reactive synthesis example by Faymonville et al.](https://arxiv.org/html/1803.09570v1)).

### Other Motivation

My impression from speaking with Federico is that there is a paucity of practically relevant benchmarks that stress the full expressive power of QF\_DT. This is why he created the "blocks world" synthetic benchmark, and it is also a limiting factor on the impact of further work on that theory. I therefore see the "proof synthesis" application as a way to potentially motivate/unblock future progress on QF\_DT solver development, both in terms of functionality and empirical performance.

<!-- For example, if improved results are possible using theory combination or using special support for list and set nodes in addition to pure sum and product types, then a benchmark set based on a proof synthesis application would let us report that, and such developments could later generalize and turn out to be useful for software verification. -->

### Technical Details

It is not crucial to use QF\_DT for this purpose, but based on a preliminary look it seems like it could be feasible:

- QF\_DT can be thought of as a way to describe DAGs where each constructor describes a way a node can be based on its children. Natural deduction "proof trees", which are perhaps better thought of as proof DAGs, exactly match this if proof rules correspond to constructors. Moreover, the mathematical expressions that appear as formulas embedded in these proof trees are also traditionally represented as ADTs (as they are in Lean and other ML-family languages). In short, QF\_DT is already designed to represent formulas and proofs.
- At least some natural deduction proof rules are straightforwardly representable in QF\_DT. For example, here is the right-and-elimination rule:

    $$\frac{\Gamma \vdash A \land B}{\Gamma \vdash B}\;(\land E_R)$$

    And to assert that proof node `b` is derived from proof node `a` by a valid application of this rule, one could write something like this:

    ```lisp
    ; a is the premise, b is the conclusion.
    (assert (is-And (conclusion a)))
    (assert (= (conclusion b)
            (right (conclusion a))))
    ```
- I suspect that other proof rules such as **$\forall$-elimination** that involve recursive functions such as **substitution** are also representable in QF\_DT by unrolling if we accept the constraint that the size of formulas in the proof is bounded.
    - In the case of substitution, I believe it will be possible for the unrolling to be linear, not exponential, in the maximum allowed number of nodes in the formula. This might be implementable by introducing an output variable for each symbolic input-expression node and constraining the output using the corresponding input constructor and child outputs.
    - I also believe that even an implementation that can only support a subset of the proof rules could still be useful to LeanTutor.
    - $\forall$-introduction, $\forall$-elimination, and $\exists$-introduction, and $\exists$-elimination are all easy to efficiently check directly without the help of an SMT solver if they are the only rule applied in a given step. For example, see [this slide](https://petervdonovan.github.io/10-2-26-presentation/14) which uses $\exists$-elimination in the "witness introduced" steps and $\exists$-introduction in the "witness found" steps, where being in $\operatorname{Range}(A)$ corresponds to existence of a preimage. The benefit that I would hope to attain by encoding these in SMT instead is the ability to discover multi-step proofs that use these rules.
    <!-- The most significant added benefit I hope to gain from supporting these in SMT queries is the ability to efficiently discover multi-step rewrites based on $\forall$-elimination when a potentially large library of $\forall$-quantified theorems is available. -->
- I suspect that theory combination could be brought into the picture by representing some subterms $\tau$ not as ADTs but as elements of the universe of some other theory, and adding proof rules with premises of the form "$\tau$ can be proven equal to term $\tau'$ by the theory solver for such objects."
